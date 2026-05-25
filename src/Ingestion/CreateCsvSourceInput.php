<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class CreateCsvSourceInput
{
    public function __construct(
        public string $name,
        public string $filename,
        public string $content,
        public CsvColumnMapping $columnMapping,
    ) {
    }
}
