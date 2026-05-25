<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

interface DocumentRepositoryInterface
{
    public function findById(int $id): ?Document;

    /** @return list<Document> */
    public function findBySourceId(int $sourceId, int $limit, int $offset): array;

    public function save(Document $document): int;

    public function softDelete(int $id, string $deletedAt): void;
}
