<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

use Nene2\Database\PdoDatabaseQueryExecutor;

final class AdminHttpTestSupport
{
    public static function seedCorpusSchema(PdoDatabaseQueryExecutor $executor): void
    {
        CorpusSchemaSetup::create($executor);
        CorpusSchemaSetup::createAdminUsers($executor);

        $hash = password_hash('secret-password', PASSWORD_ARGON2ID);
        $now = gmdate('Y-m-d H:i:s');
        $executor->execute(
            'INSERT INTO admin_users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
            ['admin@example.com', $hash, $now, $now],
        );
    }
}
