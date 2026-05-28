<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Chat;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Chat\SendChatMessageInput;
use NeneCorpus\Chat\SendChatMessageUseCase;
use NeneCorpus\ChatLimits\ChatLimitsRepositoryInterface;
use NeneCorpus\ChatLimits\ChatLimitsSettings;
use NeneCorpus\ChatLimits\ChatTokenTrackerInterface;
use NeneCorpus\Llm\Citation;
use NeneCorpus\Llm\GenerateChatReplyOutput;
use NeneCorpus\Llm\GenerateChatReplyUseCaseInterface;
use NeneCorpus\Message\MessageRole;
use NeneCorpus\Message\PdoChatMessageRepository;
use NeneCorpus\Session\ChatSession;
use NeneCorpus\Session\PdoChatSessionRepository;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\ChatSchemaSetup;
use PHPUnit\Framework\TestCase;

final class SendChatMessageUseCaseTest extends TestCase
{
    public function test_execute_persists_user_and_assistant_messages(): void
    {
        $executor = new PdoDatabaseQueryExecutor(new PdoConnectionFactory(new DatabaseConfig(
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

        ChatSchemaSetup::create($executor);

        $holder = new RequestScopedOrgIdHolder();
        $holder->setId(1);

        $sessions = new PdoChatSessionRepository($executor, $holder);
        $sessionId = $sessions->save(new ChatSession(publicToken: 'token-abc'));
        $session = $sessions->findById($sessionId);
        self::assertNotNull($session);

        $generateReply = $this->createMock(GenerateChatReplyUseCaseInterface::class);
        $generateReply->expects(self::once())
            ->method('execute')
            ->willReturn(new GenerateChatReplyOutput(
                content: 'Assistant answer.',
                citations: [
                    new Citation(
                        chunkId: 1,
                        documentId: 2,
                        sourceId: 3,
                        excerpt: 'Excerpt text.',
                    ),
                ],
            ));

        $limitsRepository = $this->createStub(ChatLimitsRepositoryInterface::class);
        $limitsRepository->method('get')->willReturn(new ChatLimitsSettings(
            maxMessageChars: 0,
            messageIntervalSeconds: 0,
            sessionRequestsPerHour: 0,
            ipRequestsPerHour: 0,
            dailyRequestsPerIp: 0,
            dailyRequestsGlobal: 0,
            dailyTokensPerIp: 0,
            dailyTokensGlobal: 0,
        ));
        $tokenTracker = $this->createStub(ChatTokenTrackerInterface::class);

        $output = (new SendChatMessageUseCase(
            $sessions,
            new PdoChatMessageRepository($executor, $holder),
            $generateReply,
            $limitsRepository,
            $tokenTracker,
        ))->execute(new SendChatMessageInput(
            sessionToken: 'token-abc',
            content: 'User question?',
        ));

        self::assertSame('assistant', $output->role);
        self::assertSame('Assistant answer.', $output->content);
        self::assertCount(1, $output->citations);

        $messages = (new PdoChatMessageRepository($executor, $holder))->findBySessionId($sessionId, 10, 0);
        self::assertCount(2, $messages);
        self::assertSame(MessageRole::User, $messages[0]->role);
        self::assertSame(MessageRole::Assistant, $messages[1]->role);
        self::assertNotNull($messages[1]->citationsJson);
    }
}
