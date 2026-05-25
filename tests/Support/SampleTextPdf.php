<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

final class SampleTextPdf
{
    public static function bytes(): string
    {
        $path = dirname(__DIR__) . '/fixtures/sample-text.pdf';
        $bytes = file_get_contents($path);

        if ($bytes === false) {
            throw new \RuntimeException('Sample PDF fixture is missing.');
        }

        return $bytes;
    }

    public static function base64(): string
    {
        return base64_encode(self::bytes());
    }
}
