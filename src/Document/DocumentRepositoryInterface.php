<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

interface DocumentRepositoryInterface
{
    public function findById(int $id): ?Document;

    /** @return list<Document> */
    public function findBySourceId(int $sourceId, int $limit, int $offset): array;

    /** @return list<DocumentSummary> */
    public function findSummariesBySourceId(int $sourceId, int $limit, int $offset, string $query = ''): array;

    public function countBySourceId(int $sourceId, string $query = ''): int;

    public function save(Document $document): int;

    public function update(Document $document): void;

    public function softDelete(int $id, string $deletedAt): void;
}
