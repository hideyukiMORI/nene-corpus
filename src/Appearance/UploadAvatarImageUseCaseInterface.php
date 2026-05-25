<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

interface UploadAvatarImageUseCaseInterface
{
    public function execute(UploadAvatarImageInput $input): UploadAvatarImageOutput;
}
