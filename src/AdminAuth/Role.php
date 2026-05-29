<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

enum Role: string
{
    case Admin = 'admin';
    case Superadmin = 'superadmin';

    public function isSuperadmin(): bool
    {
        return $this === self::Superadmin;
    }
}
