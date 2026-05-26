<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneCorpus\ChatLimits\ChatLimitsRepositoryInterface;
use NeneCorpus\ChatLimits\ChatTokenTrackerInterface;
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
        private ChatLimitsRepositoryInterface $limitsRepository,
        private ChatTokenTrackerInterface $tokenTracker,
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

        // Character limit enforcement
        $limits = $this->limitsRepository->get();

        if ($limits->maxMessageChars > 0 && mb_strlen($content) > $limits->maxMessageChars) {
            throw new ValidationException([
                new ValidationError(
                    'content',
                    sprintf('Message must not exceed %d characters.', $limits->maxMessageChars),
                    'too_long',
                ),
            ]);
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
            inputTokens: $reply->inputTokens > 0 ? $reply->inputTokens : null,
            outputTokens: $reply->outputTokens > 0 ? $reply->outputTokens : null,
        ));

        // Track token usage for daily budget enforcement
        if ($reply->inputTokens > 0 || $reply->outputTokens > 0) {
            $this->tokenTracker->track($input->clientIp, $reply->inputTokens, $reply->outputTokens);
        }

        return new SendChatMessageOutput(
            messageId: $assistantMessageId,
            sessionId: $session->id,
            role: MessageRole::Assistant->value,
            content: $reply->content,
            citations: $reply->citations,
            inputTokens: $reply->inputTokens,
            outputTokens: $reply->outputTokens,
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
