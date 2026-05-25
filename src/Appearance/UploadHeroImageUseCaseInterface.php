<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

interface UploadHeroImageUseCaseInterface
{
    public function execute(UploadHeroImageInput $input): UploadHeroImageOutput;
}
