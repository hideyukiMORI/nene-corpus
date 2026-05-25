<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

final class SampleHeroImage
{
    /** Minimal 1×1 PNG. */
    private const PNG_BYTES = "\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82";

    public static function bytes(): string
    {
        return self::PNG_BYTES;
    }

    public static function base64(): string
    {
        return base64_encode(self::bytes());
    }
}
