<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\AdminAuth;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\RateLimitSchemaSetup;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Server\RequestHandlerInterface;

final class PasswordResetHttpTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $databasePath;

    private PdoDatabaseQueryExecutor $executor;

    protected function setUp(): void
    {
        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-password-reset-' . uniqid('', true) . '.sqlite';

        $_ENV['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_SERVER['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_ENV['DB_ADAPTER'] = 'sqlite';
        $_ENV['DB_NAME'] = $this->databasePath;
        $_SERVER['DB_ADAPTER'] = 'sqlite';
        $_SERVER['DB_NAME'] = $this->databasePath;

        $container = (new RuntimeContainerFactory())->create();
        $executor  = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);
        $this->executor = $executor;

        CorpusSchemaSetup::createAdminUsers($executor);
        CorpusSchemaSetup::createAdminPasswordResets($executor);
        RateLimitSchemaSetup::create($executor);

        $hash = password_hash('secret-password', PASSWORD_ARGON2ID);
        $now  = gmdate('Y-m-d H:i:s');
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

    public function test_request_reset_returns_200_for_existing_email(): void
    {
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/password-reset/request')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'email' => 'admin@example.com',
                ], JSON_THROW_ON_ERROR))),
        );

        self::assertSame(200, $response->getStatusCode());
    }

    public function test_request_reset_returns_200_for_nonexistent_email(): void
    {
        // Enumeration prevention: always 200 regardless of whether the email exists
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/password-reset/request')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'email' => 'nobody@example.com',
                ], JSON_THROW_ON_ERROR))),
        );

        self::assertSame(200, $response->getStatusCode());
    }

    public function test_request_reset_does_not_require_auth(): void
    {
        // The endpoint must be accessible without a JWT token
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/password-reset/request')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'email' => 'admin@example.com',
                ], JSON_THROW_ON_ERROR))),
        );

        self::assertNotSame(401, $response->getStatusCode());
    }

    public function test_confirm_reset_returns_422_for_invalid_token(): void
    {
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/password-reset/confirm')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'token'        => 'invalid-token-that-does-not-exist',
                    'new_password' => 'new-secret-password',
                ], JSON_THROW_ON_ERROR))),
        );

        self::assertSame(422, $response->getStatusCode());
    }

    public function test_confirm_reset_returns_422_for_empty_token(): void
    {
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/password-reset/confirm')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'token'        => '',
                    'new_password' => 'new-secret-password',
                ], JSON_THROW_ON_ERROR))),
        );

        self::assertSame(422, $response->getStatusCode());
    }

    public function test_confirm_reset_returns_422_for_short_password(): void
    {
        $this->insertValidToken('valid-raw-token');

        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/password-reset/confirm')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'token'    => 'valid-raw-token',
                    'password' => 'short',
                ], JSON_THROW_ON_ERROR))),
        );

        self::assertSame(422, $response->getStatusCode());
    }

    public function test_confirm_reset_succeeds_with_valid_token(): void
    {
        $rawToken = 'my-valid-reset-token-123';
        $this->insertValidToken($rawToken);

        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/password-reset/confirm')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'token'    => $rawToken,
                    'password' => 'brand-new-password',
                ], JSON_THROW_ON_ERROR))),
        );

        self::assertSame(200, $response->getStatusCode());
    }

    public function test_confirm_reset_token_cannot_be_reused(): void
    {
        $rawToken = 'single-use-token-abc';
        $this->insertValidToken($rawToken);

        $app  = $this->application();
        $body = json_encode(['token' => $rawToken, 'password' => 'brand-new-password'], JSON_THROW_ON_ERROR);

        $firstResponse = $app->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/password-reset/confirm')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream($body)),
        );

        self::assertSame(200, $firstResponse->getStatusCode());

        // Second use of the same token must fail
        $secondResponse = $app->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/password-reset/confirm')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream($body)),
        );

        self::assertSame(422, $secondResponse->getStatusCode());
    }

    public function test_confirm_reset_returns_422_for_expired_token(): void
    {
        $rawToken  = 'expired-token-xyz';
        $tokenHash = hash('sha256', $rawToken);
        $now       = gmdate('Y-m-d H:i:s');
        // Expire 2 hours in the past
        $expiresAt = gmdate('Y-m-d H:i:s', time() - 7200);

        $this->executor->execute(
            'INSERT INTO admin_password_resets (token_hash, admin_user_id, expires_at, used_at, created_at) VALUES (?, ?, ?, ?, ?)',
            [$tokenHash, 1, $expiresAt, null, $now],
        );

        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/password-reset/confirm')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'token'    => $rawToken,
                    'password' => 'new-password-here',
                ], JSON_THROW_ON_ERROR))),
        );

        self::assertSame(422, $response->getStatusCode());
    }

    public function test_confirm_reset_does_not_require_auth(): void
    {
        $rawToken = 'auth-check-token';
        $this->insertValidToken($rawToken);

        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/auth/password-reset/confirm')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode([
                    'token'    => $rawToken,
                    'password' => 'new-password-here',
                ], JSON_THROW_ON_ERROR))),
        );

        self::assertNotSame(401, $response->getStatusCode());
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

    private function insertValidToken(string $rawToken): void
    {
        $tokenHash = hash('sha256', $rawToken);
        $now       = gmdate('Y-m-d H:i:s');
        $expiresAt = gmdate('Y-m-d H:i:s', time() + 3600);

        $this->executor->execute(
            'INSERT INTO admin_password_resets (token_hash, admin_user_id, expires_at, used_at, created_at) VALUES (?, ?, ?, ?, ?)',
            [$tokenHash, 1, $expiresAt, null, $now],
        );
    }

}
