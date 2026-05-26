<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

interface ChangeAdminPasswordUseCaseInterface
{
    public function execute(ChangeAdminPasswordInput $input): void;
}
