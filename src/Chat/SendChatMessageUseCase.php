<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

use NeneCorpus\Llm\ConversationTurn;
use NeneCorpus\Llm\GenerateChatReplyInput;
use NeneCorpus\Llm\GenerateChatReplyUseCaseInterface;
use NeneCorpus\Message\ChatMessage;
use NeneCorpus\Message\ChatMessageRepositoryInterface;
use NeneCorpus\Message\MessageRole;
use NeneCorpus\Session\ChatSessionRepositoryInterface;

final readonly class SendChatMessageUseCase implements SendChatMessageUseCaseInterface
{
    private const HISTORY_LIMIT = 20;

    public function __construct(
        private ChatSessionRepositoryInterface $sessions,
        private ChatMessageRepositoryInterface $messages,
        private GenerateChatReplyUseCaseInterface $generateReply,
    ) {
    }

    public function execute(SendChatMessageInput $input): SendChatMessageOutput
    {
        $session = $this->sessions->findByPublicToken($input->sessionToken);

        if ($session === null || $session->id === null) {
            throw new ChatSessionNotFoundException();
        }

        $content = trim($input->content);

        if ($content === '') {
            throw new \InvalidArgumentException('Message content is required.');
        }

        $this->messages->save(new ChatMessage(
            sessionId: $session->id,
            role: MessageRole::User,
            content: $content,
        ));

        $history = $this->buildHistory($session->id);
        $reply = $this->generateReply->execute(new GenerateChatReplyInput(
            userMessage: $content,
            history: $history,
        ));

        $citationsJson = json_encode(
            array_map(static fn ($citation) => $citation->toArray(), $reply->citations),
            JSON_THROW_ON_ERROR,
        );

        $assistantMessageId = $this->messages->save(new ChatMessage(
            sessionId: $session->id,
            role: MessageRole::Assistant,
            content: $reply->content,
            citationsJson: $citationsJson,
        ));

        return new SendChatMessageOutput(
            messageId: $assistantMessageId,
            sessionId: $session->id,
            role: MessageRole::Assistant->value,
            content: $reply->content,
            citations: $reply->citations,
        );
    }

    /**
     * @return list<ConversationTurn>
     */
    private function buildHistory(int $sessionId): array
    {
        $stored = $this->messages->findBySessionId($sessionId, self::HISTORY_LIMIT, 0);
        $history = [];

        foreach ($stored as $message) {
            if ($message->role === MessageRole::Assistant) {
                $history[] = new ConversationTurn(
                    role: 'assistant',
                    content: $message->content,
                );
                continue;
            }

            $history[] = new ConversationTurn(
                role: 'user',
                content: $message->content,
            );
        }

        if ($history === []) {
            return [];
        }

        array_pop($history);

        return $history;
    }
}
