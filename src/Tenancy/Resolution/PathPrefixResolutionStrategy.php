<?php

declare(strict_types=1);

namespace NeneCorpus\Tenancy\Resolution;

use LogicException;
use Psr\Http\Message\ServerRequestInterface;

/**
 * TODO: Path prefix resolution strategy stub.
 *
 * This strategy will resolve the organization slug from the URL path prefix.
 * Example: /org1/admin/... → slug = "org1"
 *
 * Implementation is deferred to a follow-up Issue.
 * Configuring tenant_resolution_mode = 'path' in system_config will throw
 * until this strategy is fully implemented.
 */
final readonly class PathPrefixResolutionStrategy implements OrgResolutionStrategyInterface
{
    public function resolve(ServerRequestInterface $request): ?string
    {
        // TODO: Implement path prefix org resolution (follow-up Issue)
        throw new LogicException('PathPrefixResolutionStrategy is not yet implemented. Use SingleResolutionStrategy instead.');
    }
}
