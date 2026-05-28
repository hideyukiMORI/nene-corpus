<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

final readonly class GetOrganizationByIdUseCase implements GetOrganizationByIdUseCaseInterface
{
    public function __construct(
        private OrganizationRepositoryInterface $organizations,
    ) {
    }

    public function execute(GetOrganizationByIdInput $input): GetOrganizationByIdOutput
    {
        $org = $this->organizations->findById($input->id);

        if ($org === null) {
            throw new OrganizationNotFoundException($input->id);
        }

        return new GetOrganizationByIdOutput(organization: $org);
    }
}
