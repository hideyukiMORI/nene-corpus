<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

interface ChatSessionRepositoryInterface
{
    public function findById(int $id): ?ChatSession;

    public function findByPublicToken(string $publicToken): ?ChatSession;

    public function save(ChatSession $session): int;

    public function update(ChatSession $session): void;

    /** @return list<ChatSessionSummary> */
    public function findAllSummaries(int $limit, int $offset): array;

    public function countAll(): int;
}
