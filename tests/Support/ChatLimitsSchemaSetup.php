<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

use Nene2\Database\PdoDatabaseQueryExecutor;

final class ChatLimitsSchemaSetup
{
    public static function create(PdoDatabaseQueryExecutor $executor): void
    {
        $executor->execute(
            <<<'SQL'
                CREATE TABLE chat_limits_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    max_message_chars INTEGER NOT NULL DEFAULT 800,
                    message_interval_seconds INTEGER NOT NULL DEFAULT 10,
                    session_requests_per_hour INTEGER NOT NULL DEFAULT 20,
                    ip_requests_per_hour INTEGER NOT NULL DEFAULT 60,
                    daily_requests_per_ip INTEGER NOT NULL DEFAULT 200,
                    daily_requests_global INTEGER NOT NULL DEFAULT 2000,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                SQL,
        );
    }
}
