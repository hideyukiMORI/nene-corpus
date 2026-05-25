<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class UploadStorage
{
    public function __construct(
        private string $uploadDirectory,
    ) {
    }

    public function store(UploadedFilePayload $file): string
    {
        $this->ensureDirectoryExists();

        $absolutePath = $this->uploadDirectory . '/' . $file->storedFilename;

        if (file_put_contents($absolutePath, $file->bytes) === false) {
            throw new CsvIngestionException('Failed to store uploaded file.', 'content');
        }

        return 'storage/uploads/' . $file->storedFilename;
    }

    private function ensureDirectoryExists(): void
    {
        if (is_dir($this->uploadDirectory)) {
            return;
        }

        if (!mkdir($this->uploadDirectory, 0775, true) && !is_dir($this->uploadDirectory)) {
            throw new CsvIngestionException('Upload directory is not writable.', 'content');
        }
    }
}
