<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

use PDO;
use PDOException;

final readonly class InstallAdminUserCreator
{
    public function create(InstallDatabaseConfig $database, string $email, string $passwordHash): void
    {
        try {
            $pdo = new PDO(
                $database->dsn(),
                $database->user,
                $database->password,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
            );

            $now = gmdate('Y-m-d H:i:s');

            $statement = $pdo->prepare(
                'INSERT INTO admin_users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
            );
            $statement->execute([$email, $passwordHash, $now, $now]);
        } catch (PDOException $exception) {
            throw new InstallRuntimeException(
                'Unable to create admin user: ' . $exception->getMessage(),
                0,
                $exception,
            );
        }
    }
}
