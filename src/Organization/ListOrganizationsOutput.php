<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

final readonly class ListOrganizationsOutput
{
    /**
     * @param list<Organization> $organizations
     */
    public function __construct(
        public array $organizations,
    ) {
    }
}
