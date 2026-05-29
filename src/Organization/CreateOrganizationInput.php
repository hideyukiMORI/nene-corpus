<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

final readonly class CreateOrganizationInput
{
    public function __construct(
        public string $name,
        public string $slug,
        public string $plan = 'free',
        public ?string $customDomain = null,
        public ?string $externalId = null,
    ) {
    }
}
