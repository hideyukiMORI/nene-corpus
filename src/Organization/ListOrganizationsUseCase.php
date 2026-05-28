<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

final readonly class ListOrganizationsUseCase implements ListOrganizationsUseCaseInterface
{
    public function __construct(
        private OrganizationRepositoryInterface $organizations,
    ) {
    }

    public function execute(ListOrganizationsInput $input): ListOrganizationsOutput
    {
        return new ListOrganizationsOutput(
            organizations: $this->organizations->listAll(),
        );
    }
}
