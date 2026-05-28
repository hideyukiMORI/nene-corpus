<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Settings;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Tests\Support\AdminHttpTestSupport;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\RateLimitSchemaSetup;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

final class LlmSettingsHttpTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $projectRoot;

    private string $databasePath;

    protected function setUp(): void
    {
        $_ENV['NENE_CORPUS_STUB_LLM_TEST'] = '1';
        $_SERVER['NENE_CORPUS_STUB_LLM_TEST'] = '1';

        $this->projectRoot = sys_get_temp_dir() . '/nene-corpus-llm-settings-' . uniqid('', true);
        $this->databasePath = $this->projectRoot . '/var/test.sqlite';

        mkdir($this->projectRoot . '/database/migrations', 0775, true);
        mkdir($this->projectRoot . '/var', 0775, true);
        copy(dirname(__DIR__, 2) . '/.env.example', $this->projectRoot . '/.env.example');
        copy(dirname(__DIR__, 2) . '/.env.example', $this->projectRoot . '/.env');

        foreach (glob(dirname(__DIR__, 2) . '/database/migrations/*.php') ?: [] as $migration) {
            copy($migration, $this->projectRoot . '/database/migrations/' . basename($migration));
        }

        $_ENV['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_SERVER['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_ENV['DB_ADAPTER'] = 'sqlite';
        $_ENV['DB_NAME'] = $this->databasePath;
        $_SERVER['DB_ADAPTER'] = 'sqlite';
        $_SERVER['DB_NAME'] = $this->databasePath;
        $_ENV['ANTHROPIC_API_KEY'] = 'sk-ant-api03-test-key-1234567890';
        $_SERVER['ANTHROPIC_API_KEY'] = 'sk-ant-api03-test-key-1234567890';

        $container = (new RuntimeContainerFactory($this->projectRoot))->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);

        AdminHttpTestSupport::seedTenancy($executor);
        CorpusSchemaSetup::createAdminUsers($executor);
        RateLimitSchemaSetup::create($executor);

        $hash = password_hash('secret-password', PASSWORD_ARGON2ID);
        $now = gmdate('Y-m-d H:i:s');
        $executor->execute(
            'INSERT INTO admin_users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
            ['admin@example.com', $hash, $now, $now],
        );
    }

    protected function tearDown(): void
    {
        unset($_ENV['NENE_CORPUS_STUB_LLM_TEST'], $_SERVER['NENE_CORPUS_STUB_LLM_TEST']);
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

        $this->removeDirectory($this->projectRoot);
    }

    public function test_admin_can_get_masked_llm_settings(): void
    {
        $token = $this->loginToken();
        $payload = $this->decodeJson($this->authorizedGet($token, '/admin/settings/llm'));

        self::assertTrue($payload['configured']);
        self::assertSame('sk-ant-…7890', $payload['api_key_masked']);
        self::assertSame('claude-3-5-haiku-20241022', $payload['model']);
    }

    public function test_admin_can_update_llm_settings_without_changing_key(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'model' => 'claude-3-5-haiku-20241022',
            'max_tokens' => 512,
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(512, $payload['max_tokens']);
        self::assertStringContainsString('ANTHROPIC_MAX_TOKENS=512', file_get_contents($this->projectRoot . '/.env') ?: '');
    }

    public function test_test_connection_accepts_draft_key(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPost($token, '/admin/settings/llm/test', [
            'api_key' => 'sk-ant-api03-draft-key-1234567890',
            'model' => 'claude-3-5-haiku-20241022',
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertTrue($payload['ok']);
    }

    private function loginToken(): string
    {
        $factory = new Psr17Factory();
        $handler = $this->handler();
        $response = $handler->handle(
            $factory->createServerRequest('POST', '/admin/auth/login')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($factory->createStream(json_encode([
                    'email' => 'admin@example.com',
                    'password' => 'secret-password',
                ], JSON_THROW_ON_ERROR))),
        );

        $payload = $this->decodeJson($response);

        return (string) $payload['access_token'];
    }

    private function authorizedGet(string $token, string $path): ResponseInterface
    {
        $factory = new Psr17Factory();

        return $this->handler()->handle(
            $factory->createServerRequest('GET', $path)
                ->withHeader('Authorization', 'Bearer ' . $token),
        );
    }

    /**
     * @param array<string, mixed> $body
     */
    private function authorizedPut(string $token, array $body): ResponseInterface
    {
        $factory = new Psr17Factory();

        return $this->handler()->handle(
            $factory->createServerRequest('PUT', '/admin/settings/llm')
                ->withHeader('Authorization', 'Bearer ' . $token)
                ->withHeader('Content-Type', 'application/json')
                ->withBody($factory->createStream(json_encode($body, JSON_THROW_ON_ERROR))),
        );
    }

    /**
     * @param array<string, mixed> $body
     */
    private function authorizedPost(string $token, string $path, array $body): ResponseInterface
    {
        $factory = new Psr17Factory();

        return $this->handler()->handle(
            $factory->createServerRequest('POST', $path)
                ->withHeader('Authorization', 'Bearer ' . $token)
                ->withHeader('Content-Type', 'application/json')
                ->withBody($factory->createStream(json_encode($body, JSON_THROW_ON_ERROR))),
        );
    }

    private function handler(): RequestHandlerInterface
    {
        $container = (new RuntimeContainerFactory($this->projectRoot))->create();
        $handler = $container->get(RequestHandlerInterface::class);
        self::assertInstanceOf(RequestHandlerInterface::class, $handler);

        return $handler;
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJson(ResponseInterface $response): array
    {
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertIsArray($payload);

        return $payload;
    }

    private function removeDirectory(string $directory): void
    {
        if (!is_dir($directory)) {
            return;
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST,
        );

        /** @var SplFileInfo $item */
        foreach ($iterator as $item) {
            if ($item->isDir()) {
                rmdir($item->getPathname());
            } else {
                unlink($item->getPathname());
            }
        }

        rmdir($directory);
    }
}
