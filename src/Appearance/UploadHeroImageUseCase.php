<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class UploadHeroImageUseCase implements UploadHeroImageUseCaseInterface
{
    public function __construct(
        private HeroImageUploadValidator $validator,
        private HeroImageStorage $storage,
    ) {
    }

    public function execute(UploadHeroImageInput $input): UploadHeroImageOutput
    {
        $file = $this->validator->decode($input->content, $input->filename);
        $imageUrl = $this->storage->store($file);

        return new UploadHeroImageOutput(imageUrl: $imageUrl);
    }
}
