<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use NeneCorpus\Chunk\ChunkRepositoryInterface;
use NeneCorpus\Document\DocumentRepositoryInterface;

final readonly class SourceCorpusCleaner
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private ChunkRepositoryInterface $chunks,
    ) {
    }

    public function clear(int $sourceId): void
    {
        $this->chunks->deleteBySourceId($sourceId);

        $deletedAt = gmdate('Y-m-d H:i:s');

        foreach ($this->documents->findBySourceId($sourceId, 100_000, 0) as $document) {
            if ($document->id !== null) {
                $this->documents->softDelete($document->id, $deletedAt);
            }
        }
    }
}
