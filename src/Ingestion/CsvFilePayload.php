<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class CsvFilePayload
{
    public function __construct(
        public string $bytes,
        public string $mimeType,
        public string $originalFilename,
        public string $storedFilename,
    ) {
    }

    public function byteSize(): int
    {
        return strlen($this->bytes);
    }
}
