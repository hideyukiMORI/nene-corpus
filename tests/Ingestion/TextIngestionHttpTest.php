<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Ingestion;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Tests\Support\AdminHttpTestSupport;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class TextIngestionHttpTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $databasePath;

    /** @var list<string> */
    private array $uploadedFiles = [];

    protected function setUp(): void
    {
        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-text-ingestion-' . uniqid('', true) . '.sqlite';

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

    public function test_create_text_source_persists_corpus_rows(): void
    {
        $response = $this->authorizedPost('/admin/sources', [
            'source_type' => 'text',
            'name' => 'Return policy FAQ',
            'text' => "Returns are accepted within 30 days.\nContact support for damaged items.",
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(201, $response->getStatusCode());
        self::assertSame('ready', $payload['status']);
        self::assertSame(1, $payload['document_count']);
        self::assertSame(1, $payload['chunk_count']);

        $container = (new RuntimeContainerFactory())->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);

        $source = $executor->fetchOne('SELECT storage_path, source_type FROM sources WHERE id = ?', [$payload['source_id']]);
        self::assertIsArray($source);
        self::assertSame('text', $source['source_type']);
        $this->uploadedFiles[] = (string) $source['storage_path'];

        $chunk = $executor->fetchOne('SELECT content FROM chunks WHERE source_id = ?', [$payload['source_id']]);
        self::assertIsArray($chunk);
        self::assertStringContainsString('Returns are accepted within 30 days.', (string) $chunk['content']);
    }

    public function test_reindex_text_source_rebuilds_chunks(): void
    {
        $createResponse = $this->authorizedPost('/admin/sources', [
            'source_type' => 'text',
            'name' => 'Shipping FAQ',
            'text' => 'We ship nationwide within 3 business days.',
        ]);
        $created = $this->decodeJson($createResponse);
        self::assertSame(201, $createResponse->getStatusCode());

        $container = (new RuntimeContainerFactory())->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);
        $source = $executor->fetchOne('SELECT storage_path FROM sources WHERE id = ?', [$created['source_id']]);
        self::assertIsArray($source);
        $this->uploadedFiles[] = (string) $source['storage_path'];

        $reindexResponse = $this->authorizedPost('/admin/sources/' . $created['source_id'] . '/reindex', (object) []);
        $reindexed = $this->decodeJson($reindexResponse);

        self::assertSame(200, $reindexResponse->getStatusCode());
        self::assertSame('ready', $reindexed['status']);
        self::assertSame(1, $reindexed['document_count']);
        self::assertSame(1, $reindexed['chunk_count']);
    }

    public function test_create_text_source_requires_text(): void
    {
        $response = $this->authorizedPost('/admin/sources', [
            'source_type' => 'text',
            'name' => 'Empty FAQ',
            'text' => '   ',
        ]);

        self::assertSame(422, $response->getStatusCode());
    }

    /**
     * @param array<string, mixed>|object $payload
     */
    private function authorizedPost(string $path, array|object $payload): ResponseInterface
    {
        $token = $this->loginToken();

        return $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test' . $path)
                ->withHeader('Content-Type', 'application/json')
                ->withHeader('Authorization', 'Bearer ' . $token)
                ->withBody($this->factory()->createStream(json_encode($payload, JSON_THROW_ON_ERROR))),
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
