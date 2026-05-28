<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

interface ListOrganizationsUseCaseInterface
{
    public function execute(ListOrganizationsInput $input): ListOrganizationsOutput;
}
