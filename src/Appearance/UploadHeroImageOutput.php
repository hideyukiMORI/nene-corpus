<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class UploadHeroImageOutput
{
    public function __construct(
        public string $imageUrl,
    ) {
    }
}
