-- Snapshot: documents (logical document within a source)
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(512) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    metadata_json TEXT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    deleted_at DATETIME NULL,
    FOREIGN KEY (source_id) REFERENCES sources (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_documents_source_id ON documents (source_id);
CREATE INDEX idx_documents_is_deleted ON documents (is_deleted);
