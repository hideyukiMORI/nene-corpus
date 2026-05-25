<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

final readonly class DocumentChunkPreview
{
    public function __construct(
        public int $chunkId,
        public int $chunkIndex,
        public string $content,
        public ?int $pageNumber,
        public ?string $sectionLabel,
        public ?int $tokenCount,
    ) {
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'chunk_id' => $this->chunkId,
            'chunk_index' => $this->chunkIndex,
            'content' => $this->content,
            'page_number' => $this->pageNumber,
            'section_label' => $this->sectionLabel,
            'token_count' => $this->tokenCount,
        ];
    }
}
