<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Chat;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Chunk\Chunk;
use NeneCorpus\Chunk\PdoChunkRepository;
use NeneCorpus\Document\Document;
use NeneCorpus\Document\PdoDocumentRepository;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Source\PdoSourceRepository;
use NeneCorpus\Source\Source;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Source\SourceType;
use NeneCorpus\Tests\Support\AdminHttpTestSupport;
use NeneCorpus\Tests\Support\ChatSchemaSetup;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\RateLimitSchemaSetup;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class AdminChatHttpTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $databasePath;

    protected function setUp(): void
    {
        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-admin-chat-' . uniqid('', true) . '.sqlite';

        $_ENV['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_SERVER['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_ENV['DB_ADAPTER'] = 'sqlite';
        $_ENV['DB_NAME'] = $this->databasePath;
        $_SERVER['DB_ADAPTER'] = 'sqlite';
        $_SERVER['DB_NAME'] = $this->databasePath;
        $_ENV['ANTHROPIC_API_KEY'] = '';
        $_SERVER['ANTHROPIC_API_KEY'] = '';

        $container = (new RuntimeContainerFactory())->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);

        CorpusSchemaSetup::create($executor);
        ChatSchemaSetup::create($executor);
        RateLimitSchemaSetup::create($executor);
        AdminHttpTestSupport::seedAdminUser($executor);
        $this->seedCorpus($executor);
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
            $_ENV['ANTHROPIC_API_KEY'],
            $_SERVER['ANTHROPIC_API_KEY'],
        );

        if (is_file($this->databasePath)) {
            unlink($this->databasePath);
        }
    }

    public function test_list_sessions_returns_summaries_after_chat(): void
    {
        $sessionId = $this->createChatWithMessage();

        $response = $this->authorizedRequest('GET', '/admin/chat/sessions');
        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertArrayHasKey('sessions', $payload);
        self::assertIsArray($payload['sessions']);
        self::assertNotSame([], $payload['sessions']);

        $first = $payload['sessions'][0];
        self::assertSame($sessionId, $first['session_id']);
        self::assertSame(2, $first['message_count']);
        self::assertNotEmpty($first['last_message_at']);
        self::assertNotEmpty($first['created_at']);
    }

    public function test_list_session_messages_returns_user_and_assistant_messages(): void
    {
        $sessionId = $this->createChatWithMessage();

        $response = $this->authorizedRequest('GET', '/admin/chat/sessions/' . $sessionId . '/messages');
        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame($sessionId, $payload['session_id']);
        self::assertCount(2, $payload['messages']);

        $userMessage = $payload['messages'][0];
        self::assertSame('user', $userMessage['role']);
        self::assertSame('What pairs well with seafood?', $userMessage['content']);
        self::assertSame([], $userMessage['citations']);

        $assistantMessage = $payload['messages'][1];
        self::assertSame('assistant', $assistantMessage['role']);
        self::assertNotEmpty($assistantMessage['content']);
        self::assertNotEmpty($assistantMessage['citations']);
        self::assertSame(2, $assistantMessage['citations'][0]['page_number']);
    }

    public function test_list_sessions_requires_auth(): void
    {
        $response = $this->application()->handle(
            $this->factory()->createServerRequest('GET', 'https://example.test/admin/chat/sessions'),
        );

        self::assertSame(401, $response->getStatusCode());
    }

    public function test_list_messages_for_missing_session_returns_404(): void
    {
        $response = $this->authorizedRequest('GET', '/admin/chat/sessions/9999/messages');

        self::assertSame(404, $response->getStatusCode());
    }

    private function createChatWithMessage(): int
    {
        $factory = $this->factory();
        $application = $this->application();

        $sessionResponse = $application->handle(
            $factory->createServerRequest('POST', 'https://example.test/chat/sessions'),
        );
        $sessionPayload = $this->decodeJson($sessionResponse);
        self::assertSame(201, $sessionResponse->getStatusCode());

        $messageResponse = $application->handle(
            $factory->createServerRequest('POST', 'https://example.test/chat/messages')
                ->withHeader('Content-Type', 'application/json')
                ->withHeader('X-Session-Token', $sessionPayload['session_token'])
                ->withBody($factory->createStream(json_encode([
                    'content' => 'What pairs well with seafood?',
                ], JSON_THROW_ON_ERROR))),
        );
        self::assertSame(200, $messageResponse->getStatusCode());

        return (int) $sessionPayload['session_id'];
    }

    private function seedCorpus(PdoDatabaseQueryExecutor $executor): void
    {
        $sourceId = (new PdoSourceRepository($executor))->save(new Source(
            name: 'Catalog',
            sourceType: SourceType::Pdf,
            status: SourceStatus::Ready,
            storagePath: 'storage/uploads/catalog.pdf',
        ));

        $documentId = (new PdoDocumentRepository($executor))->save(new Document(
            sourceId: $sourceId,
            title: 'Pairings',
            position: 0,
        ));

        (new PdoChunkRepository($executor))->save(new Chunk(
            documentId: $documentId,
            sourceId: $sourceId,
            content: 'Dry ginjo pairs well with white fish and light seafood dishes.',
            chunkIndex: 0,
            pageNumber: 2,
            sectionLabel: 'Pairings',
        ));
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
