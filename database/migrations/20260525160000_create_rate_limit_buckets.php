<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateRateLimitBuckets extends AbstractMigration
{
    public function change(): void
    {
        $this->table('rate_limit_buckets')
            ->addColumn('bucket_key', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('hit_count', 'integer', ['null' => false, 'default' => 0])
            ->addColumn('reset_at', 'integer', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['bucket_key'], ['unique' => true, 'name' => 'uniq_rate_limit_buckets_bucket_key'])
            ->create();
    }
}
