<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

use PDO;
use PDOException;

final readonly class DatabaseConnectionTester
{
    public function test(InstallDatabaseConfig $config): void
    {
        try {
            $pdo = new PDO(
                $config->dsn(),
                $config->user,
                $config->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 5,
                ],
            );
            $pdo->query('SELECT 1');
        } catch (PDOException $exception) {
            throw new InstallRuntimeException(
                'Database connection failed: ' . $exception->getMessage(),
                0,
                $exception,
            );
        }
    }
}
