<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Session;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Tests\Support\AdminHttpTestSupport;
use NeneCorpus\Tests\Support\ChatLimitsSchemaSetup;
use NeneCorpus\Tests\Support\ChatSchemaSetup;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\RateLimitSchemaSetup;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Server\RequestHandlerInterface;

final class CleanupChatSessionsHttpTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $databasePath;

    private PdoDatabaseQueryExecutor $executor;

    protected function setUp(): void
    {
        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-cleanup-' . uniqid('', true) . '.sqlite';

        $_ENV['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_SERVER['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_ENV['DB_ADAPTER'] = 'sqlite';
        $_ENV['DB_NAME'] = $this->databasePath;
        $_SERVER['DB_ADAPTER'] = 'sqlite';
        $_SERVER['DB_NAME'] = $this->databasePath;
        $_ENV['ANTHROPIC_API_KEY'] = '';
        $_SERVER['ANTHROPIC_API_KEY'] = '';

        $container = (new RuntimeContainerFactory())->create();
        $executor  = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);
        $this->executor = $executor;

        AdminHttpTestSupport::seedTenancy($executor);
        CorpusSchemaSetup::create($executor);
        ChatSchemaSetup::create($executor);
        RateLimitSchemaSetup::create($executor);
        ChatLimitsSchemaSetup::create($executor);
        AdminHttpTestSupport::seedAdminUser($executor);
    }

    protected function tearDown(): void
    {
        $_ENV['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
        $_SERVER['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
        unset(
            $_ENV['DB_ADAPTER'],
            $_SERVER['DB_ADAPTER'],
            $_ENV['DB_NAME'],
            $_SERVER['DB_NAME'],
            $_ENV['ANTHROPIC_API_KEY'],
            $_SERVER['ANTHROPIC_API_KEY'],
        );

        if (is_file($this->databasePath)) {
            unlink($this->databasePath);
        }
    }

    public function test_cleanup_deletes_old_sessions_and_returns_count(): void
    {
        $this->insertSession('token-old', 100);  // 100 days old → should be deleted
        $this->insertSession('token-new', 10);   // 10 days old → should be kept

        $token    = $this->login();
        $response = $this->application()->handle(
            $this->factory()->createServerRequest(
                'DELETE',
                'https://example.test/admin/chat/sessions?max_age_days=90',
            )->withHeader('Authorization', 'Bearer ' . $token),
        );

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(1, $payload['deleted_count']);

        // Verify the old session is gone but the new one remains
        $row = $this->executor->fetchOne('SELECT COUNT(*) AS cnt FROM chat_sessions', []);
        self::assertSame(1, (int) ($row['cnt'] ?? 0));
    }

    public function test_cleanup_uses_default_90_days_when_no_param(): void
    {
        $this->insertSession('token-old-95', 95);  // 95 days → deleted
        $this->insertSession('token-new-85', 85);  // 85 days → kept

        $token    = $this->login();
        $response = $this->application()->handle(
            $this->factory()->createServerRequest(
                'DELETE',
                'https://example.test/admin/chat/sessions',
            )->withHeader('Authorization', 'Bearer ' . $token),
        );

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(1, $payload['deleted_count']);
    }

    public function test_cleanup_requires_auth(): void
    {
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('DELETE', 'https://example.test/admin/chat/sessions'),
        );

        self::assertSame(401, $response->getStatusCode());
    }

    public function test_cleanup_returns_zero_when_nothing_to_delete(): void
    {
        $this->insertSession('token-fresh', 5);  // 5 days old → kept

        $token    = $this->login();
        $response = $this->application()->handle(
            $this->factory()->createServerRequest(
                'DELETE',
                'https://example.test/admin/chat/sessions?max_age_days=90',
            )->withHeader('Authorization', 'Bearer ' . $token),
        );

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(0, $payload['deleted_count']);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function application(): RequestHandlerInterface
    {
        $container   = (new RuntimeContainerFactory())->create();
        $application = $container->get(RequestHandlerInterface::class);
        self::assertInstanceOf(RequestHandlerInterface::class, $application);

        return $application;
    }

    private function factory(): Psr17Factory
    {
        return new Psr17Factory();
    }

    private function login(): string
    {
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/login')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'email'    => 'admin@example.com',
                    'password' => 'secret-password',
                ], JSON_THROW_ON_ERROR))),
        );

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());

        return (string) $payload['access_token'];
    }

    private function insertSession(string $token, int $daysAgo): void
    {
        $createdAt = gmdate('Y-m-d H:i:s', time() - $daysAgo * 86400);
        $this->executor->execute(
            'INSERT INTO chat_sessions (organization_id, public_token, client_ip, user_agent, referer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [1, $token, null, null, null, $createdAt, $createdAt],
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJson(\Psr\Http\Message\ResponseInterface $response): array
    {
        $decoded = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertIsArray($decoded);

        return $decoded;
    }
}
