<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

final readonly class ChangeAdminEmailInput
{
    public function __construct(
        public int $adminId,
        public string $currentPassword,
        public string $newEmail,
    ) {
    }
}
