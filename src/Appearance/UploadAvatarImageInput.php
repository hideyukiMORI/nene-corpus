<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class UploadAvatarImageInput
{
    public function __construct(
        public string $content,
        public string $filename,
    ) {
    }
}
