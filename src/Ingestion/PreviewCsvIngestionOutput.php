<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class PreviewCsvIngestionOutput
{
    /**
     * @param list<string> $headers
     * @param list<list<string>> $sampleRows
     */
    public function __construct(
        public array $headers,
        public array $sampleRows,
        public string $detectedDelimiter,
        public int $rowCount,
    ) {
    }
}
