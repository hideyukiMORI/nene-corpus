<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class HeroImageStorage
{
    public function __construct(
        private string $heroImageDirectory,
    ) {
    }

    public function store(HeroImagePayload $file): string
    {
        $this->ensureDirectoryExists();

        $absolutePath = $this->heroImageDirectory . '/' . $file->storedFilename;

        if (file_put_contents($absolutePath, $file->bytes) === false) {
            throw new HeroImageUploadException('Failed to store hero image.', 'content');
        }

        return HeroImagePath::publicPath($file->storedFilename);
    }

    public function resolveAbsolutePath(string $storedFilename): ?string
    {
        if (!HeroImagePath::isValidStoredFilename($storedFilename)) {
            return null;
        }

        $absolutePath = $this->heroImageDirectory . '/' . $storedFilename;

        return is_file($absolutePath) ? $absolutePath : null;
    }

    private function ensureDirectoryExists(): void
    {
        if (!is_dir($this->heroImageDirectory)) {
            if (!mkdir($this->heroImageDirectory, 0775, true) && !is_dir($this->heroImageDirectory)) {
                throw new HeroImageUploadException('Hero image directory is not writable.', 'content');
            }
        }

        if (!is_writable($this->heroImageDirectory)) {
            throw new HeroImageUploadException('Hero image directory is not writable.', 'content');
        }
    }
}
