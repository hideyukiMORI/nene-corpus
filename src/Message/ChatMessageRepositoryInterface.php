<?php

declare(strict_types=1);

namespace NeneCorpus\Message;

interface ChatMessageRepositoryInterface
{
    public function findById(int $id): ?ChatMessage;

    /** @return list<ChatMessage> */
    public function findBySessionId(int $sessionId, int $limit, int $offset): array;

    public function save(ChatMessage $message): int;
}
