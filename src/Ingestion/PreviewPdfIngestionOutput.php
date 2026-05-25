<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class PreviewPdfIngestionOutput
{
    public function __construct(
        public int $pageCount,
        public string $sampleText,
    ) {
    }
}
