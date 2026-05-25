<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

final readonly class DocumentSummary
{
    public function __construct(
        public Document $document,
        public int $chunkCount,
        public string $contentPreview,
    ) {
    }
}
