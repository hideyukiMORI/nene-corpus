<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

use Nene2\Database\PdoDatabaseQueryExecutor;

final class CorpusSchemaSetup
{
    public static function create(PdoDatabaseQueryExecutor $executor): void
    {
        $executor->execute(
            <<<'SQL'
                CREATE TABLE sources (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    storage_path TEXT NOT NULL,
                    original_filename TEXT NULL,
                    mime_type TEXT NULL,
                    byte_size INTEGER NULL,
                    error_message TEXT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    is_deleted INTEGER NOT NULL DEFAULT 0,
                    deleted_at TEXT NULL
                )
                SQL,
        );

        $executor->execute(
            <<<'SQL'
                CREATE TABLE documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    position INTEGER NOT NULL DEFAULT 0,
                    metadata_json TEXT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    is_deleted INTEGER NOT NULL DEFAULT 0,
                    deleted_at TEXT NULL,
                    FOREIGN KEY (source_id) REFERENCES sources (id) ON DELETE CASCADE
                )
                SQL,
        );

        $executor->execute(
            <<<'SQL'
                CREATE TABLE chunks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    document_id INTEGER NOT NULL,
                    source_id INTEGER NOT NULL,
                    chunk_index INTEGER NOT NULL DEFAULT 0,
                    content TEXT NOT NULL,
                    page_number INTEGER NULL,
                    section_label TEXT NULL,
                    token_count INTEGER NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
                    FOREIGN KEY (source_id) REFERENCES sources (id) ON DELETE CASCADE
                )
                SQL,
        );
    }
}
