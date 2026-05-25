<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class UploadAvatarImageOutput
{
    public function __construct(
        public string $imageUrl,
    ) {
    }
}
