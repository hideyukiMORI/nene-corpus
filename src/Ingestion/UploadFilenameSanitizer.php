<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class UploadFilenameSanitizer
{
    /**
     * @param list<string> $dangerousExtensions
     */
    public function sanitize(string $filename, string $defaultExtension, array $dangerousExtensions = ['php', 'phtml', 'phar', 'cgi', 'py', 'sh', 'exe']): string
    {
        $name = basename($filename);
        $name = str_replace("\x00", '', $name);
        $name = ltrim($name, '.');
        $name = preg_replace('/[^\w\-.]/', '_', $name) ?? '_';

        $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));

        if (in_array($extension, $dangerousExtensions, true)) {
            $base = pathinfo($name, PATHINFO_FILENAME);
            $name = $base . '_' . $extension;
        }

        if ($name === '') {
            return 'upload.' . $defaultExtension;
        }

        if (!str_ends_with(strtolower($name), '.' . $defaultExtension)) {
            $name .= '.' . $defaultExtension;
        }

        return $name;
    }
}
