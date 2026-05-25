<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\AdminAuth;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class AdminAuthHttpTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $databasePath;

    protected function setUp(): void
    {
        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-admin-auth-' . uniqid('', true) . '.sqlite';

        $_ENV['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_SERVER['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_ENV['DB_ADAPTER'] = 'sqlite';
        $_ENV['DB_NAME'] = $this->databasePath;
        $_SERVER['DB_ADAPTER'] = 'sqlite';
        $_SERVER['DB_NAME'] = $this->databasePath;

        $container = (new RuntimeContainerFactory())->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);

        CorpusSchemaSetup::createAdminUsers($executor);

        $hash = password_hash('secret-password', PASSWORD_ARGON2ID);
        $now = gmdate('Y-m-d H:i:s');
        $executor->execute(
            'INSERT INTO admin_users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
            ['admin@example.com', $hash, $now, $now],
        );
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
        );

        if (is_file($this->databasePath)) {
            unlink($this->databasePath);
        }
    }

    public function test_login_returns_bearer_token(): void
    {
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/login')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'email' => 'admin@example.com',
                    'password' => 'secret-password',
                ], JSON_THROW_ON_ERROR))),
        );

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('Bearer', $payload['token_type']);
        self::assertNotEmpty($payload['access_token']);
        self::assertNotEmpty($payload['expires_at']);
    }

    public function test_me_requires_bearer_token(): void
    {
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('GET', 'https://example.test/admin/auth/me'),
        );

        self::assertSame(401, $response->getStatusCode());
    }

    public function test_me_returns_admin_profile_with_valid_token(): void
    {
        $loginResponse = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/login')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'email' => 'admin@example.com',
                    'password' => 'secret-password',
                ], JSON_THROW_ON_ERROR))),
        );

        $loginPayload = $this->decodeJson($loginResponse);

        $meResponse = $this->application()->handle(
            $this->factory()->createServerRequest('GET', 'https://example.test/admin/auth/me')
                ->withHeader('Authorization', 'Bearer ' . $loginPayload['access_token']),
        );

        $mePayload = $this->decodeJson($meResponse);

        self::assertSame(200, $meResponse->getStatusCode());
        self::assertSame(1, $mePayload['id']);
        self::assertSame('admin@example.com', $mePayload['email']);
        self::assertSame('admin', $mePayload['role']);
    }

    public function test_login_returns_401_for_invalid_credentials(): void
    {
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/login')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'email' => 'admin@example.com',
                    'password' => 'wrong-password',
                ], JSON_THROW_ON_ERROR))),
        );

        self::assertSame(401, $response->getStatusCode());
    }

    private function application(): RequestHandlerInterface
    {
        $container = (new RuntimeContainerFactory())->create();
        $application = $container->get(RequestHandlerInterface::class);
        self::assertInstanceOf(RequestHandlerInterface::class, $application);

        return $application;
    }

    private function factory(): Psr17Factory
    {
        return new Psr17Factory();
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJson(ResponseInterface $response): array
    {
        $decoded = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertIsArray($decoded);

        return $decoded;
    }
}
