-- Snapshot: chat_limits_settings (singleton row — chat abuse prevention and cost controls)
CREATE TABLE chat_limits_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    max_message_chars INTEGER NOT NULL DEFAULT 800,
    message_interval_seconds INTEGER NOT NULL DEFAULT 10,
    session_requests_per_hour INTEGER NOT NULL DEFAULT 20,
    ip_requests_per_hour INTEGER NOT NULL DEFAULT 60,
    daily_requests_per_ip INTEGER NOT NULL DEFAULT 200,
    daily_requests_global INTEGER NOT NULL DEFAULT 2000,
    daily_tokens_per_ip INTEGER NOT NULL DEFAULT 0,
    daily_tokens_global INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
