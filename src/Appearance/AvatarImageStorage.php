<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class AvatarImageStorage
{
    public function __construct(
        private string $avatarImageDirectory,
    ) {
    }

    public function store(HeroImagePayload $file): string
    {
        $this->ensureDirectoryExists();

        $absolutePath = $this->avatarImageDirectory . '/' . $file->storedFilename;

        if (file_put_contents($absolutePath, $file->bytes) === false) {
            throw new HeroImageUploadException('Failed to store avatar image.', 'content');
        }

        return AvatarImagePath::publicPath($file->storedFilename);
    }

    public function resolveAbsolutePath(string $storedFilename): ?string
    {
        if (!AvatarImagePath::isValidStoredFilename($storedFilename)) {
            return null;
        }

        $absolutePath = $this->avatarImageDirectory . '/' . $storedFilename;

        return is_file($absolutePath) ? $absolutePath : null;
    }

    private function ensureDirectoryExists(): void
    {
        if (!is_dir($this->avatarImageDirectory)) {
            if (!mkdir($this->avatarImageDirectory, 0775, true) && !is_dir($this->avatarImageDirectory)) {
                throw new HeroImageUploadException('Avatar image directory is not writable.', 'content');
            }
        }

        if (!is_writable($this->avatarImageDirectory)) {
            throw new HeroImageUploadException('Avatar image directory is not writable.', 'content');
        }
    }
}
