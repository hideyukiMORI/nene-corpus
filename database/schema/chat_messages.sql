-- Snapshot: chat_messages (consumer chat turn)
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    citations_json TEXT NULL,
    input_tokens INTEGER NULL,
    output_tokens INTEGER NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages (session_id);
