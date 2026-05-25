-- Snapshot: rate_limit_buckets (fixed-window rate limit counters)
CREATE TABLE rate_limit_buckets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bucket_key VARCHAR(255) NOT NULL,
    hit_count INTEGER NOT NULL DEFAULT 0,
    reset_at INTEGER NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE UNIQUE INDEX uniq_rate_limit_buckets_bucket_key ON rate_limit_buckets (bucket_key);
