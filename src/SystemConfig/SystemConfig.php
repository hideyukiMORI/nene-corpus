<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

final readonly class SystemConfig
{
    public function __construct(
        public string $tenantResolutionMode,
        public string $tenantOrgSlug,
        public string $tenantBaseDomain,
    ) {
    }
}
