<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\ChatSettings;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

final class ChatSettingsHttpTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $projectRoot;

    protected function setUp(): void
    {
        $_ENV['NENE_CORPUS_STUB_LLM_TEST'] = '1';
        $_SERVER['NENE_CORPUS_STUB_LLM_TEST'] = '1';

        $this->projectRoot = sys_get_temp_dir() . '/nene-corpus-chat-settings-' . uniqid('', true);

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
        $_ENV['DB_NAME'] = $this->projectRoot . '/var/test.sqlite';
        $_SERVER['DB_ADAPTER'] = 'sqlite';
        $_SERVER['DB_NAME'] = $this->projectRoot . '/var/test.sqlite';

        $container = (new RuntimeContainerFactory($this->projectRoot))->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);

        CorpusSchemaSetup::createAdminUsers($executor);
        CorpusSchemaSetup::createChatSettings($executor);

        $hash = password_hash('secret-password', PASSWORD_ARGON2ID);
        $now = gmdate('Y-m-d H:i:s');
        $executor->execute(
            'INSERT INTO admin_users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
            ['admin@example.com', $hash, $now, $now],
        );
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->projectRoot);
    }

    public function test_get_returns_defaults_when_no_settings_saved(): void
    {
        $token = $this->loginToken();
        $response = $this->authorizedGet($token, '/admin/settings/chat');
        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertNull($payload['system_prompt']);
        self::assertNull($payload['fallback_message']);
        self::assertIsString($payload['default_system_prompt']);
        self::assertIsString($payload['default_fallback_message']);
        self::assertNotEmpty($payload['default_system_prompt']);
    }

    public function test_put_saves_and_returns_custom_settings(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'system_prompt' => 'You are a support bot for Acme Corp.',
            'fallback_message' => 'Please contact us at support@acme.example.',
        ]);
        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('You are a support bot for Acme Corp.', $payload['system_prompt']);
        self::assertSame('Please contact us at support@acme.example.', $payload['fallback_message']);
    }

    public function test_put_persists_and_get_returns_saved_settings(): void
    {
        $token = $this->loginToken();

        $this->authorizedPut($token, [
            'system_prompt' => 'Custom prompt.',
            'fallback_message' => null,
        ]);

        $response = $this->authorizedGet($token, '/admin/settings/chat');
        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('Custom prompt.', $payload['system_prompt']);
        self::assertNull($payload['fallback_message']);
    }

    public function test_put_null_clears_custom_settings(): void
    {
        $token = $this->loginToken();

        $this->authorizedPut($token, ['system_prompt' => 'Some prompt.', 'fallback_message' => 'Some fallback.']);
        $this->authorizedPut($token, ['system_prompt' => null, 'fallback_message' => null]);

        $response = $this->authorizedGet($token, '/admin/settings/chat');
        $payload = $this->decodeJson($response);

        self::assertNull($payload['system_prompt']);
        self::assertNull($payload['fallback_message']);
    }

    public function test_put_rejects_oversized_system_prompt(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'system_prompt' => str_repeat('x', 4001),
        ]);

        self::assertSame(422, $response->getStatusCode());
    }

    public function test_put_requires_auth(): void
    {
        $factory = new Psr17Factory();
        $response = $this->handler()->handle(
            $factory->createServerRequest('PUT', '/admin/settings/chat')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($factory->createStream('{"system_prompt":null}')),
        );

        self::assertSame(401, $response->getStatusCode());
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
            $factory->createServerRequest('PUT', '/admin/settings/chat')
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
