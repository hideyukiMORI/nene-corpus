<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoAdminUserRepository implements AdminUserRepositoryInterface
{
    private const SELECT_COLUMNS = 'id, email, password_hash, role, organization_id, created_at, updated_at';

    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    /**
     * Global lookup by email — used by login and password-reset paths
     * that are bypassed from org resolution.
     */
    public function findByEmail(string $email): ?AdminUser
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM admin_users WHERE email = ?',
            [$email],
        );

        if ($row === null) {
            return null;
        }

        return $this->mapRow($row);
    }

    /**
     * Global lookup by id — used by change-password / change-email paths
     * where the caller already owns the id from their JWT.
     */
    public function findById(int $id): ?AdminUser
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM admin_users WHERE id = ?',
            [$id],
        );

        if ($row === null) {
            return null;
        }

        return $this->mapRow($row);
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

    /**
     * List admins scoped to the given organization.
     * Passing null returns all admins across all organizations (superadmin scope).
     *
     * @return list<AdminUser>
     */
    public function listByOrganization(?int $organizationId): array
    {
        if ($organizationId === null) {
            $rows = $this->query->fetchAll(
                'SELECT ' . self::SELECT_COLUMNS . ' FROM admin_users ORDER BY id ASC',
                [],
            );
        } else {
            $rows = $this->query->fetchAll(
                'SELECT ' . self::SELECT_COLUMNS . ' FROM admin_users WHERE organization_id = ? ORDER BY id ASC',
                [$organizationId],
            );
        }

        return array_values(array_map(fn (array $row): AdminUser => $this->mapRow($row), $rows));
    }

    /**
     * Create a new admin user assigned to the given organization.
     * Returns the created AdminUser with id populated.
     */
    public function create(string $email, string $passwordHash, string $role, int $organizationId): AdminUser
    {
        $now = gmdate('Y-m-d H:i:s');

        $this->query->execute(
            'INSERT INTO admin_users (email, password_hash, role, organization_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [$email, $passwordHash, $role, $organizationId, $now, $now],
        );

        $row = $this->query->fetchOne(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM admin_users WHERE email = ?',
            [$email],
        );

        assert($row !== null);

        return $this->mapRow($row);
    }

    /** @param array<string, mixed> $row */
    private function mapRow(array $row): AdminUser
    {
        $rawOrgId = $row['organization_id'] ?? null;
        $orgId    = is_numeric($rawOrgId) && (int) $rawOrgId !== 0 ? (int) $rawOrgId : null;

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
}
