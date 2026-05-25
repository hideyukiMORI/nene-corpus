<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

final readonly class InstallLock
{
    public function __construct(
        private string $projectRoot,
    ) {
    }

    public function isInstalled(): bool
    {
        return is_file($this->lockPath());
    }

    public function markInstalled(): void
    {
        $directory = dirname($this->lockPath());

        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            throw new InstallRuntimeException('Unable to create install lock directory.');
        }

        $written = file_put_contents(
            $this->lockPath(),
            gmdate('c') . PHP_EOL,
            LOCK_EX,
        );

        if ($written === false) {
            throw new InstallRuntimeException('Unable to write install lock file.');
        }
    }

    private function lockPath(): string
    {
        return $this->projectRoot . '/var/installed.lock';
    }
}
