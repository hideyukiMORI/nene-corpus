<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use JsonException;

final readonly class CsvTextNormalizer
{
    private const UTF8 = 'UTF-8';

    /** @var list<string> */
    private const FALLBACK_ENCODINGS = [
        'SJIS-win',
        'SJIS',
        'Windows-1252',
        'EUC-JP',
        'ISO-2022-JP',
    ];

    /** @var list<string> */
    private const DETECT_ENCODINGS = [
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

        if ($this->isJsonSafeUtf8($bytes)) {
            return $bytes;
        }

        foreach ($this->encodingCandidates($bytes) as $encoding) {
            if ($encoding === self::UTF8) {
                continue;
            }

            $converted = mb_convert_encoding($bytes, self::UTF8, $encoding);

            if (is_string($converted) && $this->isJsonSafeUtf8($converted)) {
                return $converted;
            }
        }

        $scrubbed = $this->scrubUtf8($bytes);

        if ($this->isJsonSafeUtf8($scrubbed)) {
            return $scrubbed;
        }

        throw new CsvIngestionException(
            'CSV file uses an unsupported or invalid character encoding.',
            'content',
        );
    }

    public function scrubCell(string $value): string
    {
        if ($value === '') {
            return $value;
        }

        if ($this->isJsonSafeUtf8($value)) {
            return $value;
        }

        foreach ($this->encodingCandidates($value) as $encoding) {
            if ($encoding === self::UTF8) {
                continue;
            }

            $converted = mb_convert_encoding($value, self::UTF8, $encoding);

            if (is_string($converted) && $this->isJsonSafeUtf8($converted)) {
                return $converted;
            }
        }

        $scrubbed = $this->scrubUtf8($value);

        return $this->isJsonSafeUtf8($scrubbed) ? $scrubbed : $value;
    }

    /**
     * @return list<string>
     */
    private function encodingCandidates(string $bytes): array
    {
        $detected = mb_detect_encoding($bytes, implode(', ', self::DETECT_ENCODINGS), true);
        $candidates = [];

        if (is_string($detected) && $detected !== '') {
            $candidates[] = $detected;
        }

        foreach (self::FALLBACK_ENCODINGS as $encoding) {
            if (!in_array($encoding, $candidates, true)) {
                $candidates[] = $encoding;
            }
        }

        return $candidates;
    }

    private function stripUtf8Bom(string $bytes): string
    {
        if (str_starts_with($bytes, "\xEF\xBB\xBF")) {
            return substr($bytes, 3);
        }

        if (str_starts_with($bytes, "\xFF\xFE")) {
            return $this->convertFromEncoding(substr($bytes, 2), 'UTF-16LE') ?? $bytes;
        }

        if (str_starts_with($bytes, "\xFE\xFF")) {
            return $this->convertFromEncoding(substr($bytes, 2), 'UTF-16BE') ?? $bytes;
        }

        return $bytes;
    }

    private function convertFromEncoding(string $bytes, string $encoding): ?string
    {
        $converted = mb_convert_encoding($bytes, self::UTF8, $encoding);

        return is_string($converted) ? $converted : null;
    }

    private function scrubUtf8(string $bytes): string
    {
        if (function_exists('mb_scrub')) {
            return mb_scrub($bytes, self::UTF8);
        }

        $scrubbed = iconv(self::UTF8, self::UTF8 . '//IGNORE', $bytes);

        return is_string($scrubbed) ? $scrubbed : '';
    }

    private function isJsonSafeUtf8(string $bytes): bool
    {
        if (!mb_check_encoding($bytes, self::UTF8)) {
            return false;
        }

        try {
            json_encode($bytes, JSON_THROW_ON_ERROR);

            return true;
        } catch (JsonException) {
            return false;
        }
    }
}
