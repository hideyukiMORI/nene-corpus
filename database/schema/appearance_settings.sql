-- Snapshot: appearance_settings (widget theme + locale)
CREATE TABLE appearance_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    widget_locale VARCHAR(16) NULL,
    theme_json TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
