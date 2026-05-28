<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

final readonly class UpdateOrganizationUseCase implements UpdateOrganizationUseCaseInterface
{
    public function __construct(
        private OrganizationRepositoryInterface $organizations,
    ) {
    }

    public function execute(UpdateOrganizationInput $input): UpdateOrganizationOutput
    {
        $existing = $this->organizations->findById($input->id);

        if ($existing === null) {
            throw new OrganizationNotFoundException($input->id);
        }

        $updated = new Organization(
            name: $input->name,
            slug: $input->slug,
            plan: $input->plan,
            isActive: $input->isActive,
            id: $input->id,
            customDomain: $input->customDomain,
            externalId: $input->externalId,
            createdAt: $existing->createdAt,
        );

        $this->organizations->update($updated);

        $fresh = $this->organizations->findById($input->id);

        if ($fresh === null) {
            throw new OrganizationNotFoundException($input->id);
        }

        return new UpdateOrganizationOutput(organization: $fresh);
    }
}
