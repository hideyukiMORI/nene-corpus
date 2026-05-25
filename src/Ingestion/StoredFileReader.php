<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class StoredFileReader
{
    public function __construct(
        private string $projectRoot,
    ) {
    }

    public function read(string $storagePath): string
    {
        $absolutePath = $this->projectRoot . '/' . ltrim($storagePath, '/');

        if (!is_file($absolutePath)) {
            throw new CsvIngestionException('Stored source file is missing.', 'storage_path');
        }

        $bytes = file_get_contents($absolutePath);

        if ($bytes === false) {
            throw new CsvIngestionException('Stored source file could not be read.', 'storage_path');
        }

        return $bytes;
    }
}
