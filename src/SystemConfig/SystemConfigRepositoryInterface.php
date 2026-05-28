<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

interface SystemConfigRepositoryInterface
{
    public function get(string $key): ?string;

    public function set(string $key, string $value): void;

    /** @return array<string, string> */
    public function all(): array;
}
