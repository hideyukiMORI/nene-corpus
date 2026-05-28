<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

interface AdminUserRepositoryInterface
{
    public function findByEmail(string $email): ?AdminUser;

    public function findById(int $id): ?AdminUser;

    public function updatePassword(int $id, string $newPasswordHash): void;

    public function updateEmail(int $id, string $newEmail): void;

    /**
     * List admin users belonging to the given organization.
     * Pass null to list all organizations (superadmin scope).
     *
     * @return list<AdminUser>
     */
    public function listByOrganization(?int $organizationId): array;

    /**
     * Create a new admin user in the specified organization.
     * Returns the newly created user (with id populated).
     */
    public function create(string $email, string $passwordHash, string $role, int $organizationId): AdminUser;
}
