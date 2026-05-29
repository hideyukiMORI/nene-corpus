<?php

declare(strict_types=1);

namespace NeneCorpus\Bootstrap;

final readonly class BootstrapInfo
{
    public function __construct(
        public string $tenantResolutionMode,
        public string $tenantOrgSlug,
    ) {
    }

    /** @return array{tenant_resolution_mode: string, tenant_org_slug: string} */
    public function toArray(): array
    {
        return [
            'tenant_resolution_mode' => $this->tenantResolutionMode,
            'tenant_org_slug'        => $this->tenantOrgSlug,
        ];
    }
}
