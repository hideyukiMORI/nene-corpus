<?php

declare(strict_types=1);

namespace NeneCorpus\Tenancy\Resolution;

use NeneCorpus\SystemConfig\SystemConfigRepositoryInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Returns the configured default org slug from system_config.
 *
 * This is the default strategy for single-tenant deployments (tenant_resolution_mode = 'single').
 * The slug is read from system_config key 'tenant_org_slug'; falls back to 'default'.
 */
final readonly class SingleResolutionStrategy implements OrgResolutionStrategyInterface
{
    public function __construct(
        private SystemConfigRepositoryInterface $config,
    ) {
    }

    public function resolve(ServerRequestInterface $request): string
    {
        return $this->config->get('tenant_org_slug') ?? 'default';
    }
}
