<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use NeneCorpus\Chunk\Chunk;
use NeneCorpus\Chunk\ChunkRepositoryInterface;

final readonly class ListDocumentChunksUseCase implements ListDocumentChunksUseCaseInterface
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private ChunkRepositoryInterface $chunks,
    ) {
    }

    public function execute(int $documentId): array
    {
        $document = $this->documents->findById($documentId);

        if ($document === null || $document->id === null) {
            throw new DocumentNotFoundException($documentId);
        }

        $chunks = $this->chunks->findByDocumentId($document->id);

        return array_map(
            static function (Chunk $chunk): DocumentChunkPreview {
                if ($chunk->id === null) {
                    throw new \LogicException('Chunk id is missing.');
                }

                return new DocumentChunkPreview(
                    chunkId: $chunk->id,
                    chunkIndex: $chunk->chunkIndex,
                    content: $chunk->content,
                    pageNumber: $chunk->pageNumber,
                    sectionLabel: $chunk->sectionLabel,
                    tokenCount: $chunk->tokenCount,
                );
            },
            $chunks,
        );
    }
}
