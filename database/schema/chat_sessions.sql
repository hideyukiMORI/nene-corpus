-- Snapshot: chat_sessions (consumer chat session)
CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_token VARCHAR(64) NOT NULL,
    client_ip VARCHAR(45) NULL,
    user_agent TEXT NULL,
    referer TEXT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE UNIQUE INDEX uniq_chat_sessions_public_token ON chat_sessions (public_token);
