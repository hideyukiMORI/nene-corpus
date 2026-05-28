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
use NeneCorpus\Tests\Support\ChatLimitsSchemaSetup;
use NeneCorpus\Tests\Support\ChatSchemaSetup;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\RateLimitSchemaSetup;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class ChatHttpTest extends TestCase
{
    private string $databasePath;

    protected function setUp(): void
    {
        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-chat-' . uniqid('', true) . '.sqlite';

        $_ENV['DB_ADAPTER'] = 'sqlite';
        $_ENV['DB_NAME'] = $this->databasePath;
        $_SERVER['DB_ADAPTER'] = 'sqlite';
        $_SERVER['DB_NAME'] = $this->databasePath;
        $_ENV['ANTHROPIC_API_KEY'] = '';
        $_SERVER['ANTHROPIC_API_KEY'] = '';

        $container = (new RuntimeContainerFactory())->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);

        AdminHttpTestSupport::seedTenancy($executor);
        CorpusSchemaSetup::create($executor);
        ChatSchemaSetup::create($executor);
        RateLimitSchemaSetup::create($executor);
        ChatLimitsSchemaSetup::create($executor);
        $this->seedCorpus($executor);
    }

    protected function tearDown(): void
    {
        unset(
            $_ENV['DB_ADAPTER'],
            $_SERVER['DB_ADAPTER'],
            $_ENV['DB_NAME'],
            $_SERVER['DB_NAME'],
            $_ENV['ANTHROPIC_API_KEY'],
            $_SERVER['ANTHROPIC_API_KEY'],
            $_ENV['NENE_CORPUS_CHAT_RATE_LIMIT_SESSION'],
            $_SERVER['NENE_CORPUS_CHAT_RATE_LIMIT_SESSION'],
            $_ENV['NENE_CORPUS_CHAT_RATE_LIMIT_IP'],
            $_SERVER['NENE_CORPUS_CHAT_RATE_LIMIT_IP'],
        );

        if (is_file($this->databasePath)) {
            unlink($this->databasePath);
        }
    }

    public function test_create_session_and_send_message_returns_citations(): void
    {
        $factory = new Psr17Factory();
        $application = $this->application();

        $sessionResponse = $application->handle(
            $factory->createServerRequest('POST', 'https://example.test/chat/sessions'),
        );

        $sessionPayload = $this->decodeJson($sessionResponse);
        self::assertSame(201, $sessionResponse->getStatusCode());
        self::assertNotEmpty($sessionPayload['session_token']);

        $messageResponse = $application->handle(
            $factory->createServerRequest('POST', 'https://example.test/chat/messages')
                ->withHeader('Content-Type', 'application/json')
                ->withHeader('X-Session-Token', $sessionPayload['session_token'])
                ->withBody($factory->createStream(json_encode([
                    'content' => 'What pairs well with seafood?',
                ], JSON_THROW_ON_ERROR))),
        );

        $messagePayload = $this->decodeJson($messageResponse);

        self::assertSame(200, $messageResponse->getStatusCode());
        self::assertSame('assistant', $messagePayload['role']);
        self::assertNotEmpty($messagePayload['content']);
        self::assertNotEmpty($messagePayload['citations']);
        self::assertSame(2, $messagePayload['citations'][0]['page_number']);
    }

    public function test_send_message_returns_404_for_unknown_session_token(): void
    {
        $factory = new Psr17Factory();

        $response = $this->application()->handle(
            $factory->createServerRequest('POST', 'https://example.test/chat/messages')
                ->withHeader('Content-Type', 'application/json')
                ->withHeader('X-Session-Token', 'missing-token')
                ->withBody($factory->createStream(json_encode([
                    'content' => 'Hello',
                ], JSON_THROW_ON_ERROR))),
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function test_send_message_returns_429_when_session_rate_limit_exceeded(): void
    {
        $_ENV['NENE_CORPUS_CHAT_RATE_LIMIT_SESSION'] = '1';
        $_SERVER['NENE_CORPUS_CHAT_RATE_LIMIT_SESSION'] = '1';
        $_ENV['NENE_CORPUS_CHAT_RATE_LIMIT_IP'] = '100';
        $_SERVER['NENE_CORPUS_CHAT_RATE_LIMIT_IP'] = '100';

        $factory = new Psr17Factory();
        $application = $this->application();

        $sessionResponse = $application->handle(
            $factory->createServerRequest('POST', 'https://example.test/chat/sessions'),
        );
        $sessionPayload = $this->decodeJson($sessionResponse);

        $first = $application->handle(
            $factory->createServerRequest('POST', 'https://example.test/chat/messages')
                ->withHeader('Content-Type', 'application/json')
                ->withHeader('X-Session-Token', $sessionPayload['session_token'])
                ->withBody($factory->createStream(json_encode(['content' => 'First question'], JSON_THROW_ON_ERROR))),
        );
        self::assertSame(200, $first->getStatusCode());

        $second = $application->handle(
            $factory->createServerRequest('POST', 'https://example.test/chat/messages')
                ->withHeader('Content-Type', 'application/json')
                ->withHeader('X-Session-Token', $sessionPayload['session_token'])
                ->withBody($factory->createStream(json_encode(['content' => 'Second question'], JSON_THROW_ON_ERROR))),
        );

        self::assertSame(429, $second->getStatusCode());
        self::assertSame('0', $second->getHeaderLine('X-RateLimit-Remaining'));
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

    private function application(): RequestHandlerInterface
    {
        $container = (new RuntimeContainerFactory())->create();
        $application = $container->get(RequestHandlerInterface::class);
        self::assertInstanceOf(RequestHandlerInterface::class, $application);

        return $application;
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
