<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

final readonly class DeleteOrganizationInput
{
    public function __construct(
        public int $id,
    ) {
    }
}
