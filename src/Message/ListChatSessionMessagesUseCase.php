<?php

declare(strict_types=1);

namespace NeneCorpus\Message;

use NeneCorpus\Chat\ChatSessionNotFoundException;
use NeneCorpus\Session\ChatSessionRepositoryInterface;

final readonly class ListChatSessionMessagesUseCase implements ListChatSessionMessagesUseCaseInterface
{
    private const MAX_LIMIT = 200;

    public function __construct(
        private ChatSessionRepositoryInterface $sessions,
        private ChatMessageRepositoryInterface $messages,
    ) {
    }

    public function execute(ListChatSessionMessagesInput $input): array
    {
        if ($input->sessionId <= 0) {
            throw new ChatSessionNotFoundException();
        }

        $session = $this->sessions->findById($input->sessionId);

        if ($session === null) {
            throw new ChatSessionNotFoundException();
        }

        $limit = max(1, min(self::MAX_LIMIT, $input->limit));
        $offset = max(0, $input->offset);

        return $this->messages->findBySessionId($input->sessionId, $limit, $offset);
    }
}
