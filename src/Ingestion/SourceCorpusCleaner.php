<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use Nene2\Http\ClockInterface;
use NeneCorpus\Chunk\ChunkRepositoryInterface;
use NeneCorpus\Document\DocumentRepositoryInterface;

final readonly class SourceCorpusCleaner
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private ChunkRepositoryInterface $chunks,
        private ClockInterface $clock,
    ) {
    }

    public function clear(int $sourceId): void
    {
        $this->chunks->deleteBySourceId($sourceId);

        $deletedAt = $this->clock->now()->format('Y-m-d H:i:s');

        foreach ($this->documents->findBySourceId($sourceId, 100_000, 0) as $document) {
            if ($document->id !== null) {
                $this->documents->softDelete($document->id, $deletedAt);
            }
        }
    }
}
