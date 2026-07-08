<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\ClockInterface;

final readonly class PdoAdminPasswordResetRepository implements AdminPasswordResetRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private ClockInterface $clock,
    ) {
    }

    public function save(AdminPasswordReset $reset): void
    {
        $this->query->execute(
            'INSERT INTO admin_password_resets (token_hash, admin_user_id, expires_at, used_at, created_at) VALUES (?, ?, ?, ?, ?)',
            [$reset->tokenHash, $reset->adminUserId, $reset->expiresAt, $reset->usedAt, $reset->createdAt],
        );
    }

    public function findByTokenHash(string $tokenHash): ?AdminPasswordReset
    {
        $row = $this->query->fetchOne(
            'SELECT id, token_hash, admin_user_id, expires_at, used_at, created_at FROM admin_password_resets WHERE token_hash = ?',
            [$tokenHash],
        );

        if ($row === null) {
            return null;
        }

        return new AdminPasswordReset(
            tokenHash: (string) $row['token_hash'],
            adminUserId: (int) $row['admin_user_id'],
            expiresAt: (string) $row['expires_at'],
            usedAt: isset($row['used_at']) ? (string) $row['used_at'] : null,
            createdAt: (string) $row['created_at'],
            id: (int) $row['id'],
        );
    }

    public function markUsed(string $tokenHash): void
    {
        $this->query->execute(
            'UPDATE admin_password_resets SET used_at = ? WHERE token_hash = ?',
            [$this->clock->now()->format('Y-m-d H:i:s'), $tokenHash],
        );
    }

    public function deleteExpiredAndUsed(): void
    {
        $this->query->execute(
            'DELETE FROM admin_password_resets WHERE expires_at < ? OR used_at IS NOT NULL',
            [$this->clock->now()->format('Y-m-d H:i:s')],
        );
    }
}
