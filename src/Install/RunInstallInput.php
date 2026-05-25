<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

final readonly class RunInstallInput
{
    public function __construct(
        public InstallDatabaseConfig $database,
        public string $adminEmail,
        public string $adminPassword,
        public string $basePath,
        public ?string $anthropicApiKey,
        public string $jwtSecret,
    ) {
    }
}
