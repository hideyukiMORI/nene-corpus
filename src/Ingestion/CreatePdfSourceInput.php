<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class CreatePdfSourceInput
{
    public function __construct(
        public string $name,
        public string $filename,
        public string $content,
    ) {
    }
}
