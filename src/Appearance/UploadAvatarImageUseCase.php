<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class UploadAvatarImageUseCase implements UploadAvatarImageUseCaseInterface
{
    public function __construct(
        private HeroImageUploadValidator $validator,
        private AvatarImageStorage $storage,
    ) {
    }

    public function execute(UploadAvatarImageInput $input): UploadAvatarImageOutput
    {
        $file = $this->validator->decode($input->content, $input->filename);
        $imageUrl = $this->storage->store($file);

        return new UploadAvatarImageOutput(imageUrl: $imageUrl);
    }
}
