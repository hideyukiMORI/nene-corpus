-- Snapshot: appearance_settings (widget theme, hero, locale)
CREATE TABLE appearance_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    widget_locale VARCHAR(16) NULL,
    theme_json TEXT NOT NULL,
    hero_json TEXT NULL,
    chat_json TEXT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
