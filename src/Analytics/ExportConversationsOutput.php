<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

final readonly class ExportConversationsOutput
{
    /**
     * @param list<string>        $headers CSV column headers
     * @param list<list<string>>  $rows    CSV data rows (values already stringified)
     */
    public function __construct(
        public string $filename,
        public array $headers,
        public array $rows,
    ) {
    }
}
