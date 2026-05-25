<?php

declare(strict_types=1);

namespace NeneCorpus\Chunk;

final readonly class Chunk
{
    public function __construct(
        public int $documentId,
        public int $sourceId,
        public string $content,
        public int $chunkIndex = 0,
        public ?int $pageNumber = null,
        public ?string $sectionLabel = null,
        public ?int $tokenCount = null,
        public ?int $id = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }
}
