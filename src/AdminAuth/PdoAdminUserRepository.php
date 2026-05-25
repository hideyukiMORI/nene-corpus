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
            'SELECT id, email, password_hash, created_at, updated_at FROM admin_users WHERE email = ?',
            [$email],
        );

        if ($row === null) {
            return null;
        }

        return new AdminUser(
            email: (string) $row['email'],
            passwordHash: (string) $row['password_hash'],
            id: (int) $row['id'],
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
        );
    }
}
