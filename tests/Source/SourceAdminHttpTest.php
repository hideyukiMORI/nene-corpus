<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Source;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Tests\Support\AdminHttpTestSupport;
use NeneCorpus\Tests\Support\SampleTextPdf;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class SourceAdminHttpTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $databasePath;

    /** @var list<string> */
    private array $uploadedFiles = [];

    protected function setUp(): void
    {
        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-source-admin-' . uniqid('', true) . '.sqlite';

        $_ENV['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_SERVER['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_ENV['DB_ADAPTER'] = 'sqlite';
        $_ENV['DB_NAME'] = $this->databasePath;
        $_SERVER['DB_ADAPTER'] = 'sqlite';
        $_SERVER['DB_NAME'] = $this->databasePath;

        $container = (new RuntimeContainerFactory())->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);

        AdminHttpTestSupport::seedTenancy($executor);
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

        $projectRoot = dirname(__DIR__, 2);

        foreach ($this->uploadedFiles as $relativePath) {
            $absolutePath = $projectRoot . '/' . $relativePath;

            if (is_file($absolutePath)) {
                unlink($absolutePath);
            }
        }
    }

    public function test_delete_source_returns_204(): void
    {
        $sourceId = $this->createPdfSource();

        $response = $this->authorizedRequest('DELETE', '/admin/sources/' . $sourceId);

        self::assertSame(204, $response->getStatusCode());

        $container = (new RuntimeContainerFactory())->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);

        $source = $executor->fetchOne('SELECT is_deleted FROM sources WHERE id = ?', [$sourceId]);
        self::assertIsArray($source);
        self::assertSame(1, (int) $source['is_deleted']);
    }

    public function test_reindex_source_rebuilds_chunks(): void
    {
        $sourceId = $this->createPdfSource();

        $response = $this->authorizedRequest(
            'POST',
            '/admin/sources/' . $sourceId . '/reindex',
            '{}',
        );

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('ready', $payload['status']);
        self::assertSame(1, $payload['chunk_count']);
    }

    public function test_delete_missing_source_returns_404(): void
    {
        $response = $this->authorizedRequest('DELETE', '/admin/sources/9999');

        self::assertSame(404, $response->getStatusCode());
    }

    public function test_list_sources_returns_summaries(): void
    {
        $sourceId = $this->createPdfSource();

        $response = $this->authorizedRequest('GET', '/admin/sources');
        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertArrayHasKey('sources', $payload);
        self::assertIsArray($payload['sources']);
        self::assertNotSame([], $payload['sources']);

        $first = $payload['sources'][0];
        self::assertSame($sourceId, $first['source_id']);
        self::assertSame('ready', $first['status']);
        self::assertSame('pdf', $first['source_type']);
        self::assertSame(1, $first['document_count']);
        self::assertSame(1, $first['chunk_count']);
    }

    public function test_list_sources_requires_auth(): void
    {
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('GET', 'https://example.test/admin/sources'),
        );

        self::assertSame(401, $response->getStatusCode());
    }

    private function createPdfSource(): int
    {
        $response = $this->authorizedRequest('POST', '/admin/sources', json_encode([
            'source_type' => 'pdf',
            'name' => 'Sample manual',
            'filename' => 'sample-text.pdf',
            'content' => SampleTextPdf::base64(),
        ], JSON_THROW_ON_ERROR));

        $payload = $this->decodeJson($response);
        self::assertSame(201, $response->getStatusCode());

        $container = (new RuntimeContainerFactory())->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);

        $source = $executor->fetchOne('SELECT storage_path FROM sources WHERE id = ?', [$payload['source_id']]);
        self::assertIsArray($source);
        $this->uploadedFiles[] = (string) $source['storage_path'];

        return (int) $payload['source_id'];
    }

    private function authorizedRequest(string $method, string $path, string $body = '{}'): ResponseInterface
    {
        $token = $this->loginToken();

        return $this->application()->handle(
            $this->factory()->createServerRequest($method, 'https://example.test' . $path)
                ->withHeader('Content-Type', 'application/json')
                ->withHeader('Authorization', 'Bearer ' . $token)
                ->withBody($this->factory()->createStream($body)),
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
