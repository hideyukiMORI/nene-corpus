<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

use RuntimeException;

final class OrganizationNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Organization with id={$id} not found.");
    }
}
