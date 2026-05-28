<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

interface UpdateSystemConfigUseCaseInterface
{
    /** @throws InvalidTenantResolutionModeException */
    public function execute(UpdateSystemConfigInput $input): UpdateSystemConfigOutput;
}
