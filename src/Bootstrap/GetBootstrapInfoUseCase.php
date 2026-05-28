<?php

declare(strict_types=1);

namespace NeneCorpus\Bootstrap;

final readonly class GetBootstrapInfoUseCase implements GetBootstrapInfoUseCaseInterface
{
    /**
     * Returns bootstrap info for the Admin SPA.
     *
     * At this phase (pre-tenancy) the mode is always 'single' and the slug
     * is 'default'.  When the full Tenancy module lands it will read config
     * from the environment / DB instead.
     */
    public function execute(): BootstrapInfo
    {
        return new BootstrapInfo(
            tenantResolutionMode: 'single',
            tenantOrgSlug: 'default',
        );
    }
}
