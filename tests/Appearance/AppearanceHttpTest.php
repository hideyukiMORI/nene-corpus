<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Appearance;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class AppearanceHttpTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $databasePath;

    protected function setUp(): void
    {
        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-appearance-' . uniqid('', true) . '.sqlite';

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
        CorpusSchemaSetup::createAppearanceSettings($executor);

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

    public function test_public_widget_appearance_returns_defaults(): void
    {
        $response = $this->dispatch('GET', '/widget/appearance');
        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertNull($payload['widget_locale']);
        self::assertSame('#2563eb', $payload['theme']['color_primary']);
    }

    public function test_admin_can_update_appearance(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => 'ja',
            'theme' => [
                'color_primary' => '#dc2626',
                'color_surface' => '#ffffff',
                'color_text' => '#111827',
                'radius_md' => '0.75rem',
            ],
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('ja', $payload['widget_locale']);
        self::assertSame('#dc2626', $payload['theme']['color_primary']);

        $public = $this->decodeJson($this->dispatch('GET', '/widget/appearance'));
        self::assertSame('ja', $public['widget_locale']);
        self::assertSame('#dc2626', $public['theme']['color_primary']);
    }

    public function test_update_rejects_invalid_color(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => [
                'color_primary' => 'red',
                'color_surface' => '#ffffff',
                'color_text' => '#111827',
                'radius_md' => '0.5rem',
            ],
        ]);

        self::assertSame(422, $response->getStatusCode());
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

    /**
     * @param array<string, mixed> $body
     */
    private function authorizedPut(string $token, array $body): ResponseInterface
    {
        $factory = new Psr17Factory();

        return $this->handler()->handle(
            $factory->createServerRequest('PUT', '/admin/appearance')
                ->withHeader('Authorization', 'Bearer ' . $token)
                ->withHeader('Content-Type', 'application/json')
                ->withBody($factory->createStream(json_encode($body, JSON_THROW_ON_ERROR))),
        );
    }

    private function dispatch(string $method, string $path): ResponseInterface
    {
        $factory = new Psr17Factory();

        return $this->handler()->handle($factory->createServerRequest($method, $path));
    }

    private function handler(): RequestHandlerInterface
    {
        $container = (new RuntimeContainerFactory())->create();

        return $container->get(RequestHandlerInterface::class);
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJson(ResponseInterface $response): array
    {
        $decoded = json_decode((string) $response->getBody(), true);

        return is_array($decoded) ? $decoded : [];
    }
}
