<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

use Nene2\Install\EnvironmentWriter;
use RuntimeException;

/**
 * Renders the installed `.env` by merging operator-supplied values into the committed
 * `.env.example` template (comments and untouched defaults are preserved verbatim).
 *
 * Security-critical work is delegated to NENE2's {@see EnvironmentWriter}: every value the
 * operator supplies is serialised through it, so quotes, spaces, `#`, `$`, backslashes and the
 * like round-trip safely through phpdotenv and line breaks / null bytes are refused (closing the
 * `.env` injection hole). The file is written atomically and `chmod`ed to 0640, failing closed if
 * it cannot be made non-world-readable — so the DB password and JWT secret are never left readable
 * by every user on a shared host.
 */
final readonly class EnvFileWriter
{
    public function __construct(
        private string $projectRoot,
        private EnvironmentWriter $environmentWriter,
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
                $output[] = $this->serializeLine($key, $values[$key]);
                $writtenKeys[$key] = true;

                continue;
            }

            $output[] = $line;
        }

        foreach ($values as $key => $value) {
            if (!isset($writtenKeys[$key])) {
                $output[] = $this->serializeLine($key, $value);
            }
        }

        $content = implode(PHP_EOL, $output) . PHP_EOL;

        $this->writeAtomically($targetPath, $content);
    }

    /**
     * Serialise a single `KEY=value` line through the NENE2 EnvironmentWriter so the value is
     * escaped (and line breaks / null bytes are rejected) exactly as the toolkit does.
     */
    private function serializeLine(string $key, string $value): string
    {
        try {
            $serialized = $this->environmentWriter->serialize([$key => $value]);
        } catch (RuntimeException $exception) {
            throw new InstallRuntimeException(
                sprintf('Unable to serialise the environment value for %s: %s', $key, $exception->getMessage()),
                0,
                $exception,
            );
        }

        return rtrim($serialized, "\n");
    }

    /**
     * Atomically write the rendered content, refusing to persist secrets in a world-readable file
     * (fail-closed on 0640, mirroring EnvironmentWriter's own guarantee for the template case).
     */
    private function writeAtomically(string $path, string $content): void
    {
        $tmp = $path . '.tmp.' . bin2hex(random_bytes(6));

        if (@file_put_contents($tmp, $content, LOCK_EX) === false) {
            throw new InstallRuntimeException('Unable to write .env file.');
        }

        @chmod($tmp, 0640);

        $perms = fileperms($tmp);

        if ($perms !== false && ($perms & 0007) !== 0) {
            @unlink($tmp);

            throw new InstallRuntimeException(
                'The .env file could not be restricted to non-world-readable permissions; '
                . 'refusing to persist the database password and JWT secret where any host user could read them.',
            );
        }

        if (!@rename($tmp, $path)) {
            @unlink($tmp);

            throw new InstallRuntimeException('Unable to write .env file.');
        }
    }
}
