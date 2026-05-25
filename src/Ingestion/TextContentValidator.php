<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class TextContentValidator
{
    public const MAX_TEXT_BYTES = 5_242_880;

    public function __construct(
        private UploadFilenameSanitizer $filenameSanitizer = new UploadFilenameSanitizer(),
    ) {
    }

    public function validate(string $text): string
    {
        $normalized = trim($text);

        if ($normalized === '') {
            throw new CsvIngestionException('Text content is required.', 'text');
        }

        if (!mb_check_encoding($normalized, 'UTF-8')) {
            throw new CsvIngestionException('Text content must be valid UTF-8.', 'text');
        }

        $byteSize = strlen($normalized);

        if ($byteSize > self::MAX_TEXT_BYTES) {
            throw new CsvIngestionException(
                sprintf('Text content must be %d bytes or smaller.', self::MAX_TEXT_BYTES),
                'text',
            );
        }

        return $normalized;
    }

    public function toStoredFile(string $name, string $text): UploadedFilePayload
    {
        $normalized = $this->validate($text);
        $originalFilename = $this->filenameSanitizer->sanitize($name, 'txt');
        $storedFilename = bin2hex(random_bytes(8)) . '_' . $originalFilename;

        return new UploadedFilePayload(
            bytes: $normalized,
            mimeType: 'text/plain',
            originalFilename: $originalFilename,
            storedFilename: $storedFilename,
        );
    }
}
