<?php

declare(strict_types=1);

namespace NeneCorpus\Tenancy\Resolution;

use LogicException;
use Psr\Http\Message\ServerRequestInterface;

/**
 * TODO: Subdomain resolution strategy stub.
 *
 * This strategy will resolve the organization slug from the request subdomain.
 * Example: org1.nene-corpus.com → slug = "org1"
 *
 * Implementation is deferred to a follow-up Issue.
 * Configuring tenant_resolution_mode = 'subdomain' in system_config will throw
 * until this strategy is fully implemented.
 */
final readonly class SubdomainResolutionStrategy implements OrgResolutionStrategyInterface
{
    public function resolve(ServerRequestInterface $request): ?string
    {
        // TODO: Implement subdomain org resolution (follow-up Issue)
        throw new LogicException('SubdomainResolutionStrategy is not yet implemented. Use SingleResolutionStrategy instead.');
    }
}
