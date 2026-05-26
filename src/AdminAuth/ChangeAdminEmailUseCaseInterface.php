<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

interface ChangeAdminEmailUseCaseInterface
{
    public function execute(ChangeAdminEmailInput $input): void;
}
