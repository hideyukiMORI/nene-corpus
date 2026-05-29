<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

interface GetSystemConfigUseCaseInterface
{
    public function execute(): SystemConfig;
}
