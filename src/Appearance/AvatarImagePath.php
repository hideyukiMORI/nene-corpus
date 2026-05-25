<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class AvatarImagePath
{
    public const PUBLIC_PREFIX = '/media/avatar/';

    public static function publicPath(string $storedFilename): string
    {
        return self::PUBLIC_PREFIX . $storedFilename;
    }

    public static function isValidPublicPath(?string $path): bool
    {
        if ($path === null || $path === '') {
            return false;
        }

        if (!str_starts_with($path, self::PUBLIC_PREFIX)) {
            return false;
        }

        $filename = substr($path, strlen(self::PUBLIC_PREFIX));

        return self::isValidStoredFilename($filename);
    }

    public static function isValidStoredFilename(string $filename): bool
    {
        return preg_match('/^[a-f0-9]{16}_[\w\-.]+\.(jpe?g|png|webp)$/i', $filename) === 1;
    }

    public static function storedFilenameFromPublicPath(string $path): ?string
    {
        if (!self::isValidPublicPath($path)) {
            return null;
        }

        return substr($path, strlen(self::PUBLIC_PREFIX));
    }
}
