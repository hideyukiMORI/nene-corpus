<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

interface DeleteOrganizationUseCaseInterface
{
    /** @throws OrganizationNotFoundException */
    public function execute(DeleteOrganizationInput $input): void;
}
