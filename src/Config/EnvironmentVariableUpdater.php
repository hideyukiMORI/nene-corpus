<?php

declare(strict_types=1);

namespace NeneCorpus\Config;

final readonly class EnvironmentVariableUpdater
{
    /**
     * @param array<string, string> $values
     */
    public function apply(array $values): void
    {
        foreach ($values as $key => $value) {
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
            putenv($key . '=' . $value);
        }
    }
}
