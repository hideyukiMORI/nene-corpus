<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

final readonly class DeleteOrganizationUseCase implements DeleteOrganizationUseCaseInterface
{
    public function __construct(
        private OrganizationRepositoryInterface $organizations,
    ) {
    }

    public function execute(DeleteOrganizationInput $input): void
    {
        $this->organizations->delete($input->id);
    }
}
