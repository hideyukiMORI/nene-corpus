<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

final readonly class InstallPathResolver
{
    public function __construct(
        private string $projectRoot,
    ) {
    }

    public function resolve(): string
    {
        $fromEnv = $this->readEnvBasePath();

        if ($fromEnv !== null) {
            return $fromEnv;
        }

        return self::detectFromScriptName();
    }

    /**
     * @return array{
     *     base_path: string,
     *     widget_script_src: string,
     *     widget_css_href: string,
     *     api_base: string
     * }
     */
    public function publicPaths(): array
    {
        $basePath = $this->resolve();
        $prefix = $basePath === '' ? '' : $basePath;

        return [
            'base_path' => $prefix,
            'widget_script_src' => $prefix . '/widget.js',
            'widget_css_href' => $prefix . '/widget.css',
            'api_base' => $prefix,
        ];
    }

    public static function detectFromScriptName(): string
    {
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';

        if (!is_string($scriptName) || $scriptName === '') {
            return '';
        }

        $directory = str_replace('\\', '/', dirname($scriptName));

        if ($directory === '/' || $directory === '.' || $directory === '') {
            return '';
        }

        return rtrim($directory, '/');
    }

    private function readEnvBasePath(): ?string
    {
        $raw = $_ENV['NENE_CORPUS_BASE_PATH'] ?? $_SERVER['NENE_CORPUS_BASE_PATH'] ?? null;

        if (!is_string($raw)) {
            $envFile = $this->projectRoot . '/.env';

            if (!is_file($envFile)) {
                return null;
            }

            $contents = file_get_contents($envFile);

            if (!is_string($contents)) {
                return null;
            }

            if (preg_match('/^NENE_CORPUS_BASE_PATH=(.*)$/m', $contents, $matches) !== 1) {
                return null;
            }

            $raw = trim($matches[1], " \t\"'");
        }

        return self::normalizeBasePath($raw);
    }

    public static function normalizeBasePath(string $value): string
    {
        $trimmed = trim($value);

        if ($trimmed === '' || $trimmed === '/') {
            return '';
        }

        $normalized = '/' . trim($trimmed, '/');

        return rtrim($normalized, '/');
    }

    public function resolveProjectRelativePath(string $path): string
    {
        $trimmed = trim($path);

        if ($trimmed === '') {
            return $this->projectRoot;
        }

        if (str_starts_with($trimmed, '/')) {
            return $trimmed;
        }

        return $this->projectRoot . '/' . ltrim($trimmed, '/');
    }
}
