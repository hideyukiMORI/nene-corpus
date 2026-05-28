<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

interface CreateOrganizationUseCaseInterface
{
    /** @throws OrganizationSlugConflictException */
    public function execute(CreateOrganizationInput $input): CreateOrganizationOutput;
}
