<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

final readonly class GetSystemConfigUseCase implements GetSystemConfigUseCaseInterface
{
    public function __construct(
        private SystemConfigRepositoryInterface $config,
    ) {
    }

    public function execute(): SystemConfig
    {
        return new SystemConfig(
            tenantResolutionMode: $this->config->get('tenant_resolution_mode') ?? 'single',
            tenantOrgSlug: $this->config->get('tenant_org_slug') ?? 'default',
            tenantBaseDomain: $this->config->get('tenant_base_domain') ?? 'localhost',
        );
    }
}
