<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

final readonly class Citation
{
    public function __construct(
        public int $chunkId,
        public int $documentId,
        public int $sourceId,
        public string $excerpt,
        public ?int $pageNumber = null,
        public ?string $sectionLabel = null,
    ) {
    }

    /**
     * @return array{
     *     chunk_id: int,
     *     document_id: int,
     *     source_id: int,
     *     excerpt: string,
     *     page_number?: int,
     *     section_label?: string
     * }
     */
    public function toArray(): array
    {
        $payload = [
            'chunk_id' => $this->chunkId,
            'document_id' => $this->documentId,
            'source_id' => $this->sourceId,
            'excerpt' => $this->excerpt,
        ];

        if ($this->pageNumber !== null) {
            $payload['page_number'] = $this->pageNumber;
        }

        if ($this->sectionLabel !== null && $this->sectionLabel !== '') {
            $payload['section_label'] = $this->sectionLabel;
        }

        return $payload;
    }
}
