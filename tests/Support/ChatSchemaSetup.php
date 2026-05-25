<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

use Nene2\Database\PdoDatabaseQueryExecutor;

final class ChatSchemaSetup
{
    public static function create(PdoDatabaseQueryExecutor $executor): void
    {
        $executor->execute(
            <<<'SQL'
                CREATE TABLE chat_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    public_token TEXT NOT NULL,
                    client_ip TEXT NULL,
                    user_agent TEXT NULL,
                    referer TEXT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                SQL,
        );

        $executor->execute('CREATE UNIQUE INDEX uniq_chat_sessions_public_token ON chat_sessions (public_token)');

        $executor->execute(
            <<<'SQL'
                CREATE TABLE chat_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    citations_json TEXT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
                )
                SQL,
        );

        $executor->execute('CREATE INDEX idx_chat_messages_session_id ON chat_messages (session_id)');
    }
}
