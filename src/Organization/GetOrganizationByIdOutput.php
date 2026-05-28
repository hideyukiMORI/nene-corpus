<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

final readonly class GetOrganizationByIdOutput
{
    public function __construct(
        public Organization $organization,
    ) {
    }
}
