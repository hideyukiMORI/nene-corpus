<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class HeroImagePayload
{
    public function __construct(
        public string $bytes,
        public string $mimeType,
        public string $storedFilename,
    ) {
    }
}
