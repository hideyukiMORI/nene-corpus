<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

interface UpdateOrganizationUseCaseInterface
{
    /**
     * @throws OrganizationNotFoundException
     * @throws OrganizationSlugConflictException
     */
    public function execute(UpdateOrganizationInput $input): UpdateOrganizationOutput;
}
