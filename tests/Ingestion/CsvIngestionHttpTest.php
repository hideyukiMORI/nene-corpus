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

final class CsvIngestionHttpTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $databasePath;

    /** @var list<string> */
    private array $uploadedFiles = [];

    protected function setUp(): void
    {
        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-csv-ingestion-' . uniqid('', true) . '.sqlite';

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

        $projectRoot = dirname(__DIR__, 2);

        foreach ($this->uploadedFiles as $relativePath) {
            $absolutePath = $projectRoot . '/' . $relativePath;

            if (is_file($absolutePath)) {
                unlink($absolutePath);
            }
        }
    }

    public function test_preview_returns_headers_and_sample_rows(): void
    {
        $csv = <<<'CSV'
product_name,description,price
Widget A,Great widget,100
CSV;

        $response = $this->authorizedPost('/admin/ingestion/csv/preview', [
            'filename' => 'catalog.csv',
            'content' => base64_encode($csv),
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(['product_name', 'description', 'price'], $payload['headers']);
        self::assertSame(1, $payload['row_count']);
        self::assertSame(',', $payload['detected_delimiter']);
    }

    public function test_create_source_persists_corpus_rows(): void
    {
        $csv = <<<'CSV'
product_name,description,price
Widget A,Great widget,100
Widget B,Another widget,200
CSV;

        $response = $this->authorizedPost('/admin/sources', [
            'name' => 'Product catalog',
            'filename' => 'catalog.csv',
            'content' => base64_encode($csv),
            'column_mapping' => [
                'title_column' => 'product_name',
                'content_columns' => ['description'],
                'metadata_columns' => ['price'],
            ],
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(201, $response->getStatusCode());
        self::assertSame('ready', $payload['status']);
        self::assertSame(2, $payload['document_count']);
        self::assertSame(2, $payload['chunk_count']);

        $container = (new RuntimeContainerFactory())->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);

        $source = $executor->fetchOne('SELECT storage_path FROM sources WHERE id = ?', [$payload['source_id']]);
        self::assertIsArray($source);
        $this->uploadedFiles[] = (string) $source['storage_path'];
    }

    public function test_preview_requires_bearer_token(): void
    {
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test/admin/ingestion/csv/preview')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream('{}')),
        );

        self::assertSame(401, $response->getStatusCode());
    }

    /**
     * @param array<string, mixed> $body
     */
    private function authorizedPost(string $path, array $body): ResponseInterface
    {
        $token = $this->loginToken();

        return $this->application()->handle(
            $this->factory()->createServerRequest('POST', 'https://example.test' . $path)
                ->withHeader('Content-Type', 'application/json')
                ->withHeader('Authorization', 'Bearer ' . $token)
                ->withBody($this->factory()->createStream(json_encode($body, JSON_THROW_ON_ERROR))),
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
