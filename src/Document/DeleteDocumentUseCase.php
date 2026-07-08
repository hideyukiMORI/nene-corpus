<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use Nene2\Http\ClockInterface;
use NeneCorpus\Chunk\ChunkRepositoryInterface;

final readonly class DeleteDocumentUseCase implements DeleteDocumentUseCaseInterface
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private ChunkRepositoryInterface $chunks,
        private ClockInterface $clock,
    ) {
    }

    public function execute(int $documentId): void
    {
        $document = $this->documents->findById($documentId);

        if ($document === null || $document->id === null) {
            throw new DocumentNotFoundException($documentId);
        }

        $deletedAt = $this->clock->now()->format('Y-m-d H:i:s');

        $this->chunks->deleteByDocumentId($document->id);
        $this->documents->softDelete($document->id, $deletedAt);
    }
}
