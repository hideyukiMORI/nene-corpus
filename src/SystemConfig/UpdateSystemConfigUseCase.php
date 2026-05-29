<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

final readonly class UpdateSystemConfigUseCase implements UpdateSystemConfigUseCaseInterface
{
    /** @var list<string> */
    public const VALID_MODES = ['single', 'subdomain', 'path'];

    public function __construct(
        private SystemConfigRepositoryInterface $config,
    ) {
    }

    public function execute(UpdateSystemConfigInput $input): UpdateSystemConfigOutput
    {
        if (!in_array($input->tenantResolutionMode, self::VALID_MODES, true)) {
            throw new InvalidTenantResolutionModeException($input->tenantResolutionMode);
        }

        $this->config->set('tenant_resolution_mode', $input->tenantResolutionMode);
        $this->config->set('tenant_org_slug', $input->tenantOrgSlug);
        $this->config->set('tenant_base_domain', $input->tenantBaseDomain);

        return new UpdateSystemConfigOutput(
            config: new SystemConfig(
                tenantResolutionMode: $input->tenantResolutionMode,
                tenantOrgSlug: $input->tenantOrgSlug,
                tenantBaseDomain: $input->tenantBaseDomain,
            ),
        );
    }
}
