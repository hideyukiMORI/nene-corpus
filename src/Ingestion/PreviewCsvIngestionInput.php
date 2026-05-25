<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class PreviewCsvIngestionInput
{
    public function __construct(
        public string $filename,
        public string $content,
    ) {
    }
}
