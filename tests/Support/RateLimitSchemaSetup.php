<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

use Nene2\Database\PdoDatabaseQueryExecutor;

final class RateLimitSchemaSetup
{
    public static function create(PdoDatabaseQueryExecutor $executor): void
    {
        $executor->execute(
            <<<'SQL'
                CREATE TABLE rate_limit_buckets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    organization_id INTEGER NOT NULL DEFAULT 1,
                    bucket_key TEXT NOT NULL,
                    hit_count INTEGER NOT NULL DEFAULT 0,
                    reset_at INTEGER NOT NULL,
                    updated_at TEXT NOT NULL
                )
                SQL,
        );

        $executor->execute('CREATE UNIQUE INDEX uniq_rate_limit_buckets_org_key ON rate_limit_buckets (organization_id, bucket_key)');
    }
}
