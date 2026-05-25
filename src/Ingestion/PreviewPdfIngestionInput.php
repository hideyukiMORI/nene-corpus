<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class PreviewPdfIngestionInput
{
    public function __construct(
        public string $filename,
        public string $content,
    ) {
    }
}
