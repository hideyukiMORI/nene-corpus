<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Message;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Message\ChatMessage;
use NeneCorpus\Message\MessageRole;
use NeneCorpus\Message\PdoChatMessageRepository;
use NeneCorpus\Session\ChatSession;
use NeneCorpus\Session\PdoChatSessionRepository;
use NeneCorpus\Tests\Support\ChatSchemaSetup;
use PHPUnit\Framework\TestCase;

final class PdoChatMessageRepositoryTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

    protected function setUp(): void
    {
        $this->executor = new PdoDatabaseQueryExecutor(new PdoConnectionFactory(new DatabaseConfig(
            null,
            'test',
            'sqlite',
            'localhost',
            1,
            ':memory:',
            'nene_corpus',
            '',
            'utf8',
        )));

        ChatSchemaSetup::create($this->executor);
    }

    public function test_save_and_find_by_session_id(): void
    {
        $sessions = new PdoChatSessionRepository($this->executor);
        $messages = new PdoChatMessageRepository($this->executor);

        $sessionId = $sessions->save(new ChatSession(publicToken: 'chat-token'));

        $messages->save(new ChatMessage(
            sessionId: $sessionId,
            role: MessageRole::User,
            content: 'What is the return policy?',
        ));

        $messageId = $messages->save(new ChatMessage(
            sessionId: $sessionId,
            role: MessageRole::Assistant,
            content: 'Returns are accepted within 30 days.',
            citationsJson: json_encode([['chunk_id' => 1, 'source_id' => 1]], JSON_THROW_ON_ERROR),
        ));

        $found = $messages->findBySessionId($sessionId, 10, 0);

        self::assertCount(2, $found);
        self::assertSame(MessageRole::User, $found[0]->role);
        self::assertSame(MessageRole::Assistant, $found[1]->role);

        $byId = $messages->findById($messageId);
        self::assertNotNull($byId);
        self::assertStringContainsString('chunk_id', (string) $byId->citationsJson);
    }
}
