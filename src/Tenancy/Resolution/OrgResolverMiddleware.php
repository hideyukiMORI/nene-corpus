<?php

declare(strict_types=1);

namespace NeneCorpus\Tenancy\Resolution;

use Nene2\Error\ProblemDetailsResponseFactory;
use NeneCorpus\Organization\OrganizationRepositoryInterface;
use NeneCorpus\SystemConfig\SystemConfigRepositoryInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Resolves the current organization from the request and stores its ID
 * in RequestScopedOrgIdHolder for downstream handlers to read.
 *
 * Bypass paths (superadmin org management, health, auth) skip resolution
 * and pass through with org ID unset. Handlers on those routes must
 * not rely on the org context.
 *
 * Resolution order:
 *  1. Read tenant_resolution_mode from system_config
 *  2. Instantiate matching OrgResolutionStrategy
 *  3. strategy->resolve() → slug identifier
 *  4. OrganizationRepository::findBySlug() → Organization
 *  5. If not found by slug, try findByCustomDomain()
 *  6. 404 if still not found
 *  7. 403 if org is inactive
 *  8. Set org ID in holder + request attributes
 */
final readonly class OrgResolverMiddleware implements MiddlewareInterface
{
    /**
     * Paths that bypass org resolution entirely.
     * Superadmin routes, health checks, and auth do not need an org context.
     *
     * @var list<string>
     */
    private const BYPASS_PREFIXES = [
        '/health',
        '/machine/health',
        '/admin/auth/',
        '/admin/superadmin/',
        '/install',
    ];

    public function __construct(
        private RequestScopedOrgIdHolder $orgIdHolder,
        private OrganizationRepositoryInterface $organizations,
        private SystemConfigRepositoryInterface $systemConfig,
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $path = $request->getUri()->getPath();

        // Bypass: superadmin / health / auth / install routes don't need org context
        foreach (self::BYPASS_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return $handler->handle($request);
            }
        }

        $mode = $this->systemConfig->get('tenant_resolution_mode') ?? 'single';

        $strategy = match ($mode) {
            'subdomain' => new SubdomainResolutionStrategy(),
            'path'      => new PathPrefixResolutionStrategy(),
            default     => new SingleResolutionStrategy($this->systemConfig),
        };

        $identifier = $strategy->resolve($request);

        if ($identifier === null) {
            return $this->problemDetails->create(
                $request,
                'org-not-resolved',
                'Organization Not Resolved',
                404,
                'Could not determine the organization for this request. Check your tenant_resolution_mode configuration.',
            );
        }

        // Try by slug first, then by custom domain
        $org = $this->organizations->findBySlug($identifier)
            ?? $this->organizations->findByCustomDomain($identifier);

        if ($org === null) {
            return $this->problemDetails->create(
                $request,
                'org-not-found',
                'Organization Not Found',
                404,
                "No organization found for '{$identifier}'.",
            );
        }

        if (!$org->isActive) {
            return $this->problemDetails->create(
                $request,
                'org-inactive',
                'Organization Inactive',
                403,
                'This organization is currently inactive.',
            );
        }

        $orgId = $org->id ?? 1;
        $this->orgIdHolder->setId($orgId);

        return $handler->handle(
            $request->withAttribute('nene-corpus.org.id', $orgId)
                     ->withAttribute('nene-corpus.org.slug', $org->slug),
        );
    }
}
