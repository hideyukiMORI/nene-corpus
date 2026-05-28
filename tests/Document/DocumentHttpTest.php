<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Document;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Tests\Support\AdminHttpTestSupport;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class DocumentHttpTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $databasePath;

    /** @var list<string> */
    private array $uploadedFiles = [];

    protected function setUp(): void
    {
        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-document-http-' . uniqid('', true) . '.sqlite';

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

    public function test_admin_can_list_update_and_delete_text_document(): void
    {
        $sourceId = $this->createTextSource();

        $listResponse = $this->authorizedRequest('GET', '/admin/sources/' . $sourceId . '/documents');
        $listed = $this->decodeJson($listResponse);

        self::assertSame(200, $listResponse->getStatusCode());
        self::assertCount(1, $listed['documents']);
        $documentId = (int) $listed['documents'][0]['document_id'];

        $getResponse = $this->authorizedRequest('GET', '/admin/documents/' . $documentId);
        $detail = $this->decodeJson($getResponse);

        self::assertSame(200, $getResponse->getStatusCode());
        self::assertSame('Return policy FAQ', $detail['title']);
        self::assertStringContainsString('Returns are accepted within 30 days.', $detail['content']);

        $chunksResponse = $this->authorizedRequest('GET', '/admin/documents/' . $documentId . '/chunks');
        $chunksPayload = $this->decodeJson($chunksResponse);

        self::assertSame(200, $chunksResponse->getStatusCode());
        self::assertNotEmpty($chunksPayload['chunks']);
        self::assertStringContainsString(
            'Returns are accepted within 30 days.',
            (string) $chunksPayload['chunks'][0]['content'],
        );

        $updateResponse = $this->authorizedRequest('PUT', '/admin/documents/' . $documentId, [
            'title' => 'Updated FAQ',
            'content' => 'Updated return window is 14 days.',
        ]);
        $updated = $this->decodeJson($updateResponse);

        self::assertSame(200, $updateResponse->getStatusCode());
        self::assertSame('Updated FAQ', $updated['title']);
        self::assertSame('Updated return window is 14 days.', $updated['content']);

        $deleteResponse = $this->authorizedRequest('DELETE', '/admin/documents/' . $documentId);
        self::assertSame(204, $deleteResponse->getStatusCode());

        $missingResponse = $this->authorizedRequest('GET', '/admin/documents/' . $documentId);
        self::assertSame(404, $missingResponse->getStatusCode());
    }

    private function createTextSource(): int
    {
        $response = $this->authorizedPost('/admin/sources', [
            'source_type' => 'text',
            'name' => 'Return policy FAQ',
            'text' => "Returns are accepted within 30 days.\nContact support for damaged items.",
        ]);
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

    /**
     * @param array<string, mixed>|null $payload
     */
    private function authorizedRequest(string $method, string $path, ?array $payload = null): ResponseInterface
    {
        $token = $this->loginToken();
        $request = $this->factory()->createServerRequest($method, 'https://example.test' . $path)
            ->withHeader('Authorization', 'Bearer ' . $token);

        if ($payload !== null) {
            $request = $request
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->factory()->createStream(json_encode($payload, JSON_THROW_ON_ERROR)));
        }

        return $this->application()->handle($request);
    }

    /**
     * @param array<string, mixed>|object $payload
     */
    private function authorizedPost(string $path, array|object $payload): ResponseInterface
    {
        return $this->authorizedRequest('POST', $path, (array) $payload);
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

        return $container->get(RequestHandlerInterface::class);
    }

    private function factory(): Psr17Factory
    {
        return new Psr17Factory();
    }

    /** @return array<string, mixed> */
    private function decodeJson(ResponseInterface $response): array
    {
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertIsArray($payload);

        return $payload;
    }
}
