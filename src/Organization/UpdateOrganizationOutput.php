<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

final readonly class UpdateOrganizationOutput
{
    public function __construct(
        public Organization $organization,
    ) {
    }
}
