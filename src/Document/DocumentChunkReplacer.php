<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use NeneCorpus\Chunk\Chunk;
use NeneCorpus\Chunk\ChunkRepositoryInterface;

final readonly class DocumentChunkReplacer
{
    public function __construct(
        private ChunkRepositoryInterface $chunks,
    ) {
    }

    public function replace(int $documentId, int $sourceId, string $content): void
    {
        $this->chunks->deleteByDocumentId($documentId);

        $this->chunks->save(new Chunk(
            documentId: $documentId,
            sourceId: $sourceId,
            content: $content,
            chunkIndex: 0,
            tokenCount: $this->estimateTokenCount($content),
        ));
    }

    private function estimateTokenCount(string $content): int
    {
        return (int) ceil(mb_strlen($content) / 4);
    }
}
