<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use NeneCorpus\Source\SourceStatus;

final readonly class CreateCsvSourceOutput
{
    public function __construct(
        public int $sourceId,
        public string $name,
        public SourceStatus $status,
        public int $documentCount,
        public int $chunkCount,
    ) {
    }
}
