<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use finfo;

final readonly class CsvUploadValidator
{
    public const MAX_FILE_BYTES = 5_242_880;

    /** @var list<string> */
    private const ALLOWED_MIME_TYPES = [
        'text/plain',
        'text/csv',
        'application/csv',
        'text/x-csv',
        'application/vnd.ms-excel',
    ];

    public function decode(string $base64Content, string $filename): CsvFilePayload
    {
        $base64Content = trim($base64Content);

        if ($base64Content === '') {
            throw new CsvIngestionException('CSV content is required.', 'content');
        }

        $bytes = base64_decode($base64Content, true);

        if ($bytes === false) {
            throw new CsvIngestionException('CSV content must be valid base64.', 'content');
        }

        $size = strlen($bytes);

        if ($size === 0) {
            throw new CsvIngestionException('CSV file is empty.', 'content');
        }

        if ($size > self::MAX_FILE_BYTES) {
            throw new CsvIngestionException(
                sprintf('CSV file must be %d bytes or smaller.', self::MAX_FILE_BYTES),
                'content',
            );
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->buffer($bytes);

        if (!is_string($mimeType) || !in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            throw new CsvIngestionException('Uploaded file must be a CSV document.', 'content');
        }

        $sanitized = $this->sanitizeFilename($filename);
        $storedFilename = bin2hex(random_bytes(8)) . '_' . $sanitized;

        return new CsvFilePayload(
            bytes: $bytes,
            mimeType: $mimeType,
            originalFilename: $sanitized,
            storedFilename: $storedFilename,
        );
    }

    private function sanitizeFilename(string $filename): string
    {
        $name = basename($filename);
        $name = str_replace("\x00", '', $name);
        $name = ltrim($name, '.');
        $name = preg_replace('/[^\w\-.]/', '_', $name) ?? '_';

        $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        $dangerousExtensions = ['php', 'phtml', 'phar', 'cgi', 'py', 'sh', 'exe'];

        if (in_array($extension, $dangerousExtensions, true)) {
            $base = pathinfo($name, PATHINFO_FILENAME);
            $name = $base . '_' . $extension;
        }

        if ($name === '') {
            return 'upload.csv';
        }

        if (!str_ends_with(strtolower($name), '.csv')) {
            $name .= '.csv';
        }

        return $name;
    }
}
