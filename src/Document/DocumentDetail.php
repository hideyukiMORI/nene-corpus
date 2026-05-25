<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

final readonly class DocumentDetail
{
    public function __construct(
        public int $documentId,
        public int $sourceId,
        public string $title,
        public int $position,
        public int $chunkCount,
        public string $content,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'document_id' => $this->documentId,
            'source_id' => $this->sourceId,
            'title' => $this->title,
            'position' => $this->position,
            'chunk_count' => $this->chunkCount,
            'content' => $this->content,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
