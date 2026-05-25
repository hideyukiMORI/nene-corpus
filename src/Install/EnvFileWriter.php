<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

final readonly class EnvFileWriter
{
    public function __construct(
        private string $projectRoot,
    ) {
    }

    /**
     * @param array<string, string> $values
     */
    public function write(array $values): void
    {
        $examplePath = $this->projectRoot . '/.env.example';
        $targetPath = $this->projectRoot . '/.env';

        if (!is_file($examplePath)) {
            throw new InstallRuntimeException('.env.example is missing.');
        }

        $template = file_get_contents($examplePath);

        if (!is_string($template)) {
            throw new InstallRuntimeException('Unable to read .env.example.');
        }

        $lines = preg_split('/\r\n|\n|\r/', $template);

        if (!is_array($lines)) {
            throw new InstallRuntimeException('Unable to parse .env.example.');
        }

        $writtenKeys = [];
        $output = [];

        foreach ($lines as $line) {
            if ($line === '' || str_starts_with(trim($line), '#')) {
                $output[] = $line;

                continue;
            }

            if (preg_match('/^([A-Z0-9_]+)=(.*)$/', $line, $matches) !== 1) {
                $output[] = $line;

                continue;
            }

            $key = $matches[1];

            if (array_key_exists($key, $values)) {
                $output[] = $key . '=' . $this->escapeValue($values[$key]);
                $writtenKeys[$key] = true;

                continue;
            }

            $output[] = $line;
        }

        foreach ($values as $key => $value) {
            if (!isset($writtenKeys[$key])) {
                $output[] = $key . '=' . $this->escapeValue($value);
            }
        }

        $content = implode(PHP_EOL, $output) . PHP_EOL;

        if (file_put_contents($targetPath, $content, LOCK_EX) === false) {
            throw new InstallRuntimeException('Unable to write .env file.');
        }
    }

    private function escapeValue(string $value): string
    {
        if ($value === '') {
            return '';
        }

        if (preg_match('/[\s#"\']/', $value) === 1) {
            return '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], $value) . '"';
        }

        return $value;
    }
}
