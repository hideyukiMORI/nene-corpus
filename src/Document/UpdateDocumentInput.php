<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

final readonly class UpdateDocumentInput
{
    public function __construct(
        public int $documentId,
        public string $title,
        public string $content,
    ) {
    }
}
