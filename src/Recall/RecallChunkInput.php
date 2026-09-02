<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

use NeneCorpus\Chunk\Chunk;

/**
 * A chunk on its way into Recall.
 *
 * 🔴 The Corpus id travels as `external_id`, never as `chunk_id`: Recall's own
 * `chunk_id` is its identity column, and writing a foreign id into it would stop
 * its sequence from advancing (Recall ADR 0020 Decision 1).
 */
final readonly class RecallChunkInput
{
    public function __construct(
        public int $externalId,
        public int $documentId,
        public int $sourceId,
        public int $chunkIndex,
        public string $content,
        public ?int $pageNumber = null,
        public ?string $sectionLabel = null,
    ) {
    }

    public static function fromChunk(int $externalId, Chunk $chunk): self
    {
        return new self(
            externalId: $externalId,
            documentId: $chunk->documentId,
            sourceId: $chunk->sourceId,
            chunkIndex: $chunk->chunkIndex,
            content: $chunk->content,
            pageNumber: $chunk->pageNumber,
            sectionLabel: $chunk->sectionLabel,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toPayload(): array
    {
        return [
            'external_id' => $this->externalId,
            'document_id' => $this->documentId,
            'source_id' => $this->sourceId,
            'chunk_index' => $this->chunkIndex,
            'content' => $this->content,
            'page_number' => $this->pageNumber,
            'section_label' => $this->sectionLabel,
        ];
    }
}
