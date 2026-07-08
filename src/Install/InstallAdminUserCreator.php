<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

use Nene2\Http\ClockInterface;
use PDO;
use PDOException;

final readonly class InstallAdminUserCreator
{
    public function __construct(
        private ClockInterface $clock,
    ) {
    }

    public function create(InstallDatabaseConfig $database, string $email, string $passwordHash): void
    {
        try {
            $pdo = new PDO(
                $database->dsn(),
                $database->user,
                $database->password,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
            );

            $now = $this->clock->now()->format('Y-m-d H:i:s');

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
