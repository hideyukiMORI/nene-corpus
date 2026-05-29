<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

use RuntimeException;

final class OrganizationSlugConflictException extends RuntimeException
{
    public function __construct(string $slug)
    {
        parent::__construct("Organization slug '{$slug}' is already taken.");
    }
}
