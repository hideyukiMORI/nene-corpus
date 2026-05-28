<?php

declare(strict_types=1);

namespace NeneCorpus\Tenancy\Resolution;

use Psr\Http\Message\ServerRequestInterface;

/**
 * Resolves the organization identifier (slug or custom domain) from an incoming HTTP request.
 *
 * Implementations:
 *  - SingleResolutionStrategy    — returns the configured default slug from system_config
 *  - SubdomainResolutionStrategy — stub (see TODO comment, implemented in a follow-up Issue)
 *  - PathPrefixResolutionStrategy — stub (see TODO comment, implemented in a follow-up Issue)
 */
interface OrgResolutionStrategyInterface
{
    /**
     * Returns the org slug or custom domain identifier.
     * Returns null when this strategy cannot determine an org from the request.
     */
    public function resolve(ServerRequestInterface $request): ?string;
}
