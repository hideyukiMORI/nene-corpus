-- Snapshot: sources (corpus ingestion origin)
CREATE TABLE sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    storage_path VARCHAR(512) NOT NULL,
    original_filename VARCHAR(255) NULL,
    mime_type VARCHAR(127) NULL,
    byte_size BIGINT UNSIGNED NULL,
    error_message TEXT NULL,
    ingestion_config_json TEXT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    deleted_at DATETIME NULL
);

CREATE INDEX idx_sources_status ON sources (status);
CREATE INDEX idx_sources_is_deleted ON sources (is_deleted);
