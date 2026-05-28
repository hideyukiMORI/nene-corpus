<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

final readonly class UpdateOrganizationInput
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public string $plan,
        public bool $isActive,
        public ?string $customDomain = null,
        public ?string $externalId = null,
    ) {
    }
}
