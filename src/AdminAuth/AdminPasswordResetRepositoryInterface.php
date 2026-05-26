<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

interface AdminPasswordResetRepositoryInterface
{
    public function save(AdminPasswordReset $reset): void;

    public function findByTokenHash(string $tokenHash): ?AdminPasswordReset;

    public function markUsed(string $tokenHash): void;

    /** Delete expired and used tokens to keep the table clean. */
    public function deleteExpiredAndUsed(): void;
}
