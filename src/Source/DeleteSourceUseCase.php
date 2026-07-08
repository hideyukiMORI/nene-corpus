<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

use Nene2\Http\ClockInterface;
use NeneCorpus\Chunk\ChunkRepositoryInterface;
use NeneCorpus\Document\DocumentRepositoryInterface;

final readonly class DeleteSourceUseCase implements DeleteSourceUseCaseInterface
{
    public function __construct(
        private SourceRepositoryInterface $sources,
        private DocumentRepositoryInterface $documents,
        private ChunkRepositoryInterface $chunks,
        private ClockInterface $clock,
    ) {
    }

    public function execute(int $sourceId): void
    {
        $source = $this->sources->findById($sourceId);

        if ($source === null) {
            throw new SourceNotFoundException($sourceId);
        }

        $deletedAt = $this->clock->now()->format('Y-m-d H:i:s');

        foreach ($this->documents->findBySourceId($sourceId, 100_000, 0) as $document) {
            if ($document->id !== null) {
                $this->documents->softDelete($document->id, $deletedAt);
            }
        }

        $this->chunks->deleteBySourceId($sourceId);
        $this->sources->softDelete($sourceId, $deletedAt);
    }
}
