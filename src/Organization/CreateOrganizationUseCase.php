<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

final readonly class CreateOrganizationUseCase implements CreateOrganizationUseCaseInterface
{
    public function __construct(
        private OrganizationRepositoryInterface $organizations,
    ) {
    }

    public function execute(CreateOrganizationInput $input): CreateOrganizationOutput
    {
        $org = new Organization(
            name: $input->name,
            slug: $input->slug,
            plan: $input->plan,
            isActive: true,
            customDomain: $input->customDomain,
            externalId: $input->externalId,
        );

        $id = $this->organizations->save($org);

        return new CreateOrganizationOutput(id: $id);
    }
}
