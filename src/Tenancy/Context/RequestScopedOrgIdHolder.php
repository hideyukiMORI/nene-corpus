<?php

declare(strict_types=1);

namespace NeneCorpus\Tenancy\Context;

/**
 * Holds the resolved organization ID for the current request.
 *
 * This is set by OrgResolverMiddleware after successfully resolving the organization.
 * Repositories should not call getId() on bypass paths (superadmin / health / auth).
 */
final class RequestScopedOrgIdHolder
{
    private ?int $id = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function clear(): void
    {
        $this->id = null;
    }
}
