<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

interface AdminUserRepositoryInterface
{
    public function findByEmail(string $email): ?AdminUser;
}
