<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use JsonException;

final readonly class CsvTextNormalizer
{
    private const UTF8 = 'UTF-8';

    /** @var list<string> */
    private const LEGACY_ENCODINGS = [
        'SJIS-win',
        'SJIS',
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
        'ASCII',
    ];

    public function normalize(string $bytes): string
    {
        if ($bytes === '') {
            return $bytes;
        }

        $bytes = $this->stripBom($bytes);

        if ($this->isJsonSafeUtf8($bytes)) {
            return $bytes;
        }

        if (mb_check_encoding($bytes, self::UTF8)) {
            $scrubbed = $this->scrubUtf8($bytes);

            if ($this->isJsonSafeUtf8($scrubbed)) {
                return $scrubbed;
            }
        } elseif ($this->headerLooksLikeUtf8($bytes)) {
            // UTF-8 export with isolated bad bytes (e.g. WooCommerce); do not misread as Shift-JIS.
            $scrubbed = $this->scrubUtf8($bytes);

            if ($this->isJsonSafeUtf8($scrubbed)) {
                return $scrubbed;
            }
        } else {
            foreach ($this->legacyEncodingCandidates($bytes) as $encoding) {
                $converted = mb_convert_encoding($bytes, self::UTF8, $encoding);

                if (is_string($converted) && $this->isJsonSafeUtf8($converted)) {
                    return $converted;
                }
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
        if ($value === '' || $this->isJsonSafeUtf8($value)) {
            return $value;
        }

        $scrubbed = $this->scrubUtf8($value);

        return $this->isJsonSafeUtf8($scrubbed) ? $scrubbed : $value;
    }

    /**
     * @return list<string>
     */
    private function legacyEncodingCandidates(string $bytes): array
    {
        $detected = mb_detect_encoding($bytes, implode(', ', self::DETECT_ENCODINGS), true);
        $candidates = [];

        if (is_string($detected) && $detected !== '' && $detected !== self::UTF8) {
            $candidates[] = $detected;
        }

        foreach (self::LEGACY_ENCODINGS as $encoding) {
            if (!in_array($encoding, $candidates, true)) {
                $candidates[] = $encoding;
            }
        }

        return $candidates;
    }

    private function headerLooksLikeUtf8(string $bytes): bool
    {
        $firstLine = $this->firstLine($bytes);

        if ($firstLine === '' || !mb_check_encoding($firstLine, self::UTF8)) {
            return false;
        }

        return preg_match('/[^\x00-\x7F]/', $firstLine) === 1;
    }

    private function firstLine(string $bytes): string
    {
        $length = strcspn($bytes, "\r\n");

        return substr($bytes, 0, $length);
    }

    private function stripBom(string $bytes): string
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
