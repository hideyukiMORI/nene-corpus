<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoAdminUserRepository implements AdminUserRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function findByEmail(string $email): ?AdminUser
    {
        $row = $this->query->fetchOne(
            'SELECT id, email, password_hash, role, organization_id, created_at, updated_at FROM admin_users WHERE email = ?',
            [$email],
        );

        if ($row === null) {
            return null;
        }

        return $this->mapRow($row);
    }

    public function findById(int $id): ?AdminUser
    {
        $row = $this->query->fetchOne(
            'SELECT id, email, password_hash, role, organization_id, created_at, updated_at FROM admin_users WHERE id = ?',
            [$id],
        );

        if ($row === null) {
            return null;
        }

        return $this->mapRow($row);
    }

    /** @param array<string, mixed> $row */
    private function mapRow(array $row): AdminUser
    {
        $rawOrgId = $row['organization_id'] ?? null;
        $orgId = is_numeric($rawOrgId) && (int) $rawOrgId !== 0 ? (int) $rawOrgId : null;

        return new AdminUser(
            email: (string) $row['email'],
            passwordHash: (string) $row['password_hash'],
            id: (int) $row['id'],
            role: (string) ($row['role'] ?? 'admin'),
            organizationId: $orgId,
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
        );
    }

    public function updatePassword(int $id, string $newPasswordHash): void
    {
        $this->query->execute(
            'UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?',
            [$newPasswordHash, gmdate('Y-m-d H:i:s'), $id],
        );
    }

    public function updateEmail(int $id, string $newEmail): void
    {
        $this->query->execute(
            'UPDATE admin_users SET email = ?, updated_at = ? WHERE id = ?',
            [$newEmail, gmdate('Y-m-d H:i:s'), $id],
        );
    }
}
