<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class CsvTextNormalizer
{
    private const UTF8 = 'UTF-8';

    /** @var list<string> */
    private const CANDIDATE_ENCODINGS = [
        'UTF-8',
        'SJIS-win',
        'SJIS',
        'EUC-JP',
        'ISO-2022-JP',
        'Windows-1252',
        'ASCII',
    ];

    public function normalize(string $bytes): string
    {
        if ($bytes === '') {
            return $bytes;
        }

        $bytes = $this->stripUtf8Bom($bytes);

        if ($this->isValidUtf8($bytes)) {
            return $bytes;
        }

        $encoding = mb_detect_encoding($bytes, implode(', ', self::CANDIDATE_ENCODINGS), true);

        if ($encoding === false || $encoding === self::UTF8) {
            $encoding = 'SJIS-win';
        }

        $converted = mb_convert_encoding($bytes, self::UTF8, $encoding);

        if (!is_string($converted) || !$this->isValidUtf8($converted)) {
            throw new CsvIngestionException(
                'CSV file uses an unsupported or invalid character encoding.',
                'content',
            );
        }

        return $converted;
    }

    private function stripUtf8Bom(string $bytes): string
    {
        return str_starts_with($bytes, "\xEF\xBB\xBF") ? substr($bytes, 3) : $bytes;
    }

    private function isValidUtf8(string $bytes): bool
    {
        return mb_check_encoding($bytes, self::UTF8);
    }
}
