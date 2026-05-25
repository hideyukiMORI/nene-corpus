<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class StoredFileWriter
{
    public function __construct(
        private string $projectRoot,
    ) {
    }

    public function write(string $storagePath, string $bytes): void
    {
        $absolutePath = $this->projectRoot . '/' . ltrim($storagePath, '/');

        if (file_put_contents($absolutePath, $bytes) === false) {
            throw new CsvIngestionException('Stored source file could not be updated.', 'content');
        }
    }
}
