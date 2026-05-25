<?php

declare(strict_types=1);

namespace NeneCorpus\Chunk;

interface ChunkRepositoryInterface
{
    public function findById(int $id): ?Chunk;

    /** @return list<Chunk> */
    public function findByDocumentId(int $documentId): array;

    public function save(Chunk $chunk): int;

    public function deleteByDocumentId(int $documentId): void;

    public function deleteBySourceId(int $sourceId): void;
}
