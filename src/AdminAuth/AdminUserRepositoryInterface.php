<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

interface AdminUserRepositoryInterface
{
    public function findByEmail(string $email): ?AdminUser;

    public function findById(int $id): ?AdminUser;

    public function updatePassword(int $id, string $newPasswordHash): void;

    public function updateEmail(int $id, string $newEmail): void;
}
