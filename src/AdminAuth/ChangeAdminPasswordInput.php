<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

final readonly class ChangeAdminPasswordInput
{
    public function __construct(
        public int $adminId,
        public string $currentPassword,
        public string $newPassword,
    ) {
    }
}
