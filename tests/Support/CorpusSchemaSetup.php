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
                    ingestion_config_json TEXT NULL,
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

    public static function createAdminUsers(PdoDatabaseQueryExecutor $executor): void
    {
        $executor->execute(
            <<<'SQL'
                CREATE TABLE admin_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                SQL,
        );

        $executor->execute('CREATE UNIQUE INDEX uniq_admin_users_email ON admin_users (email)');
    }

    public static function createAdminPasswordResets(PdoDatabaseQueryExecutor $executor): void
    {
        $executor->execute(
            <<<'SQL'
                CREATE TABLE admin_password_resets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    token_hash TEXT NOT NULL,
                    admin_user_id INTEGER NOT NULL,
                    expires_at TEXT NOT NULL,
                    used_at TEXT NULL,
                    created_at TEXT NOT NULL
                )
                SQL,
        );

        $executor->execute('CREATE UNIQUE INDEX uniq_admin_password_resets_token_hash ON admin_password_resets (token_hash)');
    }

    public static function createChatSettings(PdoDatabaseQueryExecutor $executor): void
    {
        $executor->execute(
            <<<'SQL'
                CREATE TABLE corpus_chat_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    system_prompt TEXT NULL,
                    fallback_message TEXT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                SQL,
        );
    }

    public static function createAppearanceSettings(PdoDatabaseQueryExecutor $executor): void
    {
        $executor->execute(
            <<<'SQL'
                CREATE TABLE appearance_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    widget_locale TEXT NULL,
                    theme_json TEXT NOT NULL,
                    hero_json TEXT NULL,
                    chat_json TEXT NULL,
                    layout_json TEXT NULL,
                    custom_css TEXT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                SQL,
        );
    }
}
