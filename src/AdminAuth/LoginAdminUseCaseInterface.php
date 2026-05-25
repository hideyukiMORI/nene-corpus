<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

interface LoginAdminUseCaseInterface
{
    public function execute(LoginAdminInput $input): LoginAdminOutput;
}
