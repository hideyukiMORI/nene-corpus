<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

final readonly class LoginAdminInput
{
    public function __construct(
        public string $email,
        public string $password,
    ) {
    }
}
