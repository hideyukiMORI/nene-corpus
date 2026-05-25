<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Install;

use NeneCorpus\Http\RuntimeContainerFactory;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

final class InstallHttpTest extends TestCase
{
    private string $projectRoot;

    protected function setUp(): void
    {
        $this->projectRoot = sys_get_temp_dir() . '/nene-corpus-install-' . uniqid('', true);
        mkdir($this->projectRoot . '/database/migrations', 0775, true);
        mkdir($this->projectRoot . '/database/seeds', 0775, true);
        mkdir($this->projectRoot . '/var', 0775, true);

        copy(dirname(__DIR__, 2) . '/.env.example', $this->projectRoot . '/.env.example');

        foreach (glob(dirname(__DIR__, 2) . '/database/migrations/*.php') ?: [] as $migration) {
            copy($migration, $this->projectRoot . '/database/migrations/' . basename($migration));
        }
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->projectRoot);
    }

    public function test_install_flow_with_sqlite(): void
    {
        $status = $this->decodeJson($this->dispatch('GET', '/install/status'));

        self::assertFalse($status['installed']);
        self::assertArrayHasKey('paths', $status);

        $sqlitePath = $this->projectRoot . '/var/install-test.sqlite';

        $install = $this->decodeJson($this->dispatch('POST', '/install', [
            'base_path' => '',
            'database' => [
                'adapter' => 'sqlite',
                'name' => $sqlitePath,
            ],
            'admin' => [
                'email' => 'installer@example.com',
                'password' => 'secret-password',
            ],
        ]));

        self::assertTrue($install['installed']);
        self::assertSame('installer@example.com', $install['admin_email']);
        self::assertFileExists($this->projectRoot . '/.env');
        self::assertFileExists($this->projectRoot . '/var/installed.lock');
        self::assertFileExists($sqlitePath . '.sqlite3');

        $again = $this->dispatch('POST', '/install', [
            'database' => ['adapter' => 'sqlite', 'name' => $sqlitePath],
            'admin' => ['email' => 'other@example.com', 'password' => 'secret-password'],
        ]);

        self::assertSame(403, $again->getStatusCode());
    }

    /**
     * @param array<string, mixed>|null $body
     */
    private function dispatch(string $method, string $path, ?array $body = null): ResponseInterface
    {
        $container = (new RuntimeContainerFactory($this->projectRoot))->create();
        $factory = new Psr17Factory();
        $handler = $container->get(RequestHandlerInterface::class);
        self::assertInstanceOf(RequestHandlerInterface::class, $handler);

        $request = $factory->createServerRequest($method, 'http://localhost' . $path);

        if ($body !== null) {
            $request = $request
                ->withHeader('Content-Type', 'application/json')
                ->withBody($factory->createStream(json_encode($body, JSON_THROW_ON_ERROR)));
        }

        return $handler->handle($request);
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

                continue;
            }

            unlink($item->getPathname());
        }

        rmdir($directory);
    }
}
