<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Http;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Tests\Support\AdminHttpTestSupport;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Guards the pagination limit clamp (security: an unbounded ?limit= is a DoS / limit-injection
 * vector). The admin list endpoints must bound the page size and reject an out-of-range limit
 * with 422 rather than accept an arbitrarily large one. The rejection happens in the handler,
 * before any repository query, so it holds even for endpoints whose data is not seeded here.
 */
final class AdminListPaginationTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $databasePath;

    protected function setUp(): void
    {
        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-pagination-' . uniqid('', true) . '.sqlite';

        $_ENV['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_SERVER['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_ENV['DB_ADAPTER'] = 'sqlite';
        $_ENV['DB_NAME'] = $this->databasePath;
        $_SERVER['DB_ADAPTER'] = 'sqlite';
        $_SERVER['DB_NAME'] = $this->databasePath;

        $container = (new RuntimeContainerFactory())->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);

        AdminHttpTestSupport::seedCorpusSchema($executor);
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

    /**
     * @return iterable<string, array{string}>
     */
    public static function listEndpoints(): iterable
    {
        yield 'sources' => ['/admin/sources'];
        yield 'chat sessions' => ['/admin/chat/sessions'];
        yield 'chat session messages' => ['/admin/chat/sessions/1/messages'];
    }

    #[DataProvider('listEndpoints')]
    public function test_limit_above_maximum_is_rejected_with_422(string $path): void
    {
        $response = $this->authorizedRequest('GET', $path . '?limit=999999');

        self::assertSame(422, $response->getStatusCode(), $path . ' must reject an over-range limit');
    }

    #[DataProvider('listEndpoints')]
    public function test_non_positive_limit_is_rejected_with_422(string $path): void
    {
        $response = $this->authorizedRequest('GET', $path . '?limit=0');

        self::assertSame(422, $response->getStatusCode(), $path . ' must reject a non-positive limit');
    }

    public function test_sources_accepts_limit_within_bounds(): void
    {
        $response = $this->authorizedRequest('GET', '/admin/sources?limit=10&offset=0');

        self::assertSame(200, $response->getStatusCode());
        self::assertArrayHasKey('sources', $this->decodeJson($response));
    }

    public function test_sources_accepts_maximum_limit(): void
    {
        $response = $this->authorizedRequest('GET', '/admin/sources?limit=200');

        self::assertSame(200, $response->getStatusCode());
    }

    private function authorizedRequest(string $method, string $path): ResponseInterface
    {
        $token = $this->loginToken();

        return $this->application()->handle(
            $this->factory()->createServerRequest($method, 'https://example.test' . $path)
                ->withHeader('Authorization', 'Bearer ' . $token),
        );
    }

    private function loginToken(): string
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

        return (string) $payload['access_token'];
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
