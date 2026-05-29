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
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
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

    private function makeSessions(int $orgId = 1): PdoChatSessionRepository
    {
        $holder = new RequestScopedOrgIdHolder();
        $holder->setId($orgId);

        return new PdoChatSessionRepository($this->executor, $holder);
    }

    private function makeMessages(int $orgId = 1): PdoChatMessageRepository
    {
        $holder = new RequestScopedOrgIdHolder();
        $holder->setId($orgId);

        return new PdoChatMessageRepository($this->executor, $holder);
    }

    public function test_save_and_find_by_session_id(): void
    {
        $sessions = $this->makeSessions();
        $messages = $this->makeMessages();

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

    public function test_messages_are_isolated_by_organization(): void
    {
        $sessions1 = $this->makeSessions(1);
        $sessions2 = $this->makeSessions(2);
        $messages1 = $this->makeMessages(1);
        $messages2 = $this->makeMessages(2);

        $sessionId1 = $sessions1->save(new ChatSession(publicToken: 'isolation-org1-token'));
        $sessionId2 = $sessions2->save(new ChatSession(publicToken: 'isolation-org2-token'));

        $messages1->save(new ChatMessage(
            sessionId: $sessionId1,
            role: MessageRole::User,
            content: 'org1 question',
        ));

        $messages2->save(new ChatMessage(
            sessionId: $sessionId2,
            role: MessageRole::User,
            content: 'org2 question',
        ));

        // org1 repo finds its own message
        $found1 = $messages1->findBySessionId($sessionId1, 10, 0);
        self::assertCount(1, $found1);
        self::assertSame('org1 question', $found1[0]->content);

        // org2 repo finds its own message
        $found2 = $messages2->findBySessionId($sessionId2, 10, 0);
        self::assertCount(1, $found2);
        self::assertSame('org2 question', $found2[0]->content);

        // org1 cannot see org2's session messages
        $cross = $messages1->findBySessionId($sessionId2, 10, 0);
        self::assertCount(0, $cross);
    }

    public function test_find_by_id_does_not_cross_organization_boundary(): void
    {
        $sessions1 = $this->makeSessions(1);
        $sessions2 = $this->makeSessions(2);
        $messages1 = $this->makeMessages(1);
        $messages2 = $this->makeMessages(2);

        $sessionId1 = $sessions1->save(new ChatSession(publicToken: 'cross-msg-org1-token'));
        $sessions2->save(new ChatSession(publicToken: 'cross-msg-org2-token'));

        $msgId = $messages1->save(new ChatMessage(
            sessionId: $sessionId1,
            role: MessageRole::User,
            content: 'cross org message',
        ));

        // org2 cannot find org1's message by id
        self::assertNull($messages2->findById($msgId));
        // org1 can find its own message
        self::assertNotNull($messages1->findById($msgId));
    }
}
