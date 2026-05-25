<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use finfo;

final readonly class PdfUploadValidator
{
    public const MAX_FILE_BYTES = 5_242_880;

    /** @var list<string> */
    private const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'application/x-pdf',
    ];

    public function __construct(
        private UploadFilenameSanitizer $filenameSanitizer = new UploadFilenameSanitizer(),
    ) {
    }

    public function decode(string $base64Content, string $filename): UploadedFilePayload
    {
        $base64Content = trim($base64Content);

        if ($base64Content === '') {
            throw new CsvIngestionException('PDF content is required.', 'content');
        }

        $bytes = base64_decode($base64Content, true);

        if ($bytes === false) {
            throw new CsvIngestionException('PDF content must be valid base64.', 'content');
        }

        $size = strlen($bytes);

        if ($size === 0) {
            throw new CsvIngestionException('PDF file is empty.', 'content');
        }

        if ($size > self::MAX_FILE_BYTES) {
            throw new CsvIngestionException(
                sprintf('PDF file must be %d bytes or smaller.', self::MAX_FILE_BYTES),
                'content',
            );
        }

        if (!str_starts_with($bytes, '%PDF-')) {
            throw new CsvIngestionException('Uploaded file must be a PDF document.', 'content');
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->buffer($bytes);

        if (!is_string($mimeType) || !in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            throw new CsvIngestionException('Uploaded file must be a PDF document.', 'content');
        }

        $sanitized = $this->filenameSanitizer->sanitize($filename, 'pdf');
        $storedFilename = bin2hex(random_bytes(8)) . '_' . $sanitized;

        return new UploadedFilePayload(
            bytes: $bytes,
            mimeType: $mimeType,
            originalFilename: $sanitized,
            storedFilename: $storedFilename,
        );
    }
}
