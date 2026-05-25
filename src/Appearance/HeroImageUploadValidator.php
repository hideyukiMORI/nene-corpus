<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use finfo;
use NeneCorpus\Ingestion\UploadFilenameSanitizer;

final readonly class HeroImageUploadValidator
{
    public const MAX_FILE_BYTES = 2_097_152;

    /** @var array<string, string> */
    private const MIME_TO_EXTENSION = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function __construct(
        private UploadFilenameSanitizer $filenameSanitizer = new UploadFilenameSanitizer(),
    ) {
    }

    public function decode(string $base64Content, string $filename): HeroImagePayload
    {
        $base64Content = trim($base64Content);

        if ($base64Content === '') {
            throw new HeroImageUploadException('Image content is required.', 'content');
        }

        $bytes = base64_decode($base64Content, true);

        if ($bytes === false) {
            throw new HeroImageUploadException('Image content must be valid base64.', 'content');
        }

        $size = strlen($bytes);

        if ($size === 0) {
            throw new HeroImageUploadException('Image file is empty.', 'content');
        }

        if ($size > self::MAX_FILE_BYTES) {
            throw new HeroImageUploadException(
                sprintf('Image file must be %d bytes or smaller.', self::MAX_FILE_BYTES),
                'content',
            );
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->buffer($bytes);

        if (!is_string($mimeType) || !array_key_exists($mimeType, self::MIME_TO_EXTENSION)) {
            throw new HeroImageUploadException('Uploaded file must be JPEG, PNG, or WebP.', 'content');
        }

        $extension = self::MIME_TO_EXTENSION[$mimeType];
        $sanitized = $this->filenameSanitizer->sanitize($filename, $extension, ['php', 'phtml', 'phar', 'cgi', 'py', 'sh', 'exe', 'js', 'html', 'svg']);
        $storedFilename = bin2hex(random_bytes(8)) . '_' . $sanitized;

        return new HeroImagePayload(
            bytes: $bytes,
            mimeType: $mimeType,
            storedFilename: $storedFilename,
        );
    }
}
