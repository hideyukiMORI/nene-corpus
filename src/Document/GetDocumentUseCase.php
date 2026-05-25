<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use NeneCorpus\Chunk\ChunkRepositoryInterface;

final readonly class GetDocumentUseCase implements GetDocumentUseCaseInterface
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private ChunkRepositoryInterface $chunks,
        private DocumentContentReader $contentReader,
    ) {
    }

    public function execute(int $documentId): DocumentDetail
    {
        $document = $this->documents->findById($documentId);

        if ($document === null || $document->id === null) {
            throw new DocumentNotFoundException($documentId);
        }

        $chunks = $this->chunks->findByDocumentId($document->id);

        return new DocumentDetail(
            documentId: $document->id,
            sourceId: $document->sourceId,
            title: $document->title,
            position: $document->position,
            chunkCount: count($chunks),
            content: $this->contentReader->read($document->id),
            createdAt: (string) $document->createdAt,
            updatedAt: (string) $document->updatedAt,
        );
    }
}
