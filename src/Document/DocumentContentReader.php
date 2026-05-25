<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use NeneCorpus\Chunk\ChunkRepositoryInterface;

final readonly class DocumentContentReader
{
    public function __construct(
        private ChunkRepositoryInterface $chunks,
    ) {
    }

    public function read(int $documentId): string
    {
        $parts = [];

        foreach ($this->chunks->findByDocumentId($documentId) as $chunk) {
            $parts[] = $chunk->content;
        }

        return implode("\n\n", $parts);
    }

    public function preview(int $documentId, int $maxLength = 120): string
    {
        $content = $this->read($documentId);

        if (mb_strlen($content) <= $maxLength) {
            return $content;
        }

        return mb_substr($content, 0, $maxLength) . '…';
    }
}
