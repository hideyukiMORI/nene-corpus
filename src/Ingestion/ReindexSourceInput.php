<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class ReindexSourceInput
{
    public function __construct(
        public int $sourceId,
        public ?CsvColumnMapping $columnMappingOverride = null,
    ) {
    }
}
