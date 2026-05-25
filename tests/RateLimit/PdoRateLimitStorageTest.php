<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\RateLimit;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\RateLimit\PdoRateLimitStorage;
use NeneCorpus\Tests\Support\RateLimitSchemaSetup;
use PHPUnit\Framework\TestCase;

final class PdoRateLimitStorageTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

    protected function setUp(): void
    {
        $this->executor = new PdoDatabaseQueryExecutor(new PdoConnectionFactory(new DatabaseConfig(
            null,
            'test',
            'sqlite',
            'localhost',
            1,
            ':memory:',
            'nene_corpus',
            '',
            'utf8',
        )));

        RateLimitSchemaSetup::create($this->executor);
    }

    public function test_hit_increments_count_within_window(): void
    {
        $storage = new PdoRateLimitStorage($this->executor);

        $first = $storage->hit('chat:session:abc', 60);
        $second = $storage->hit('chat:session:abc', 60);

        self::assertSame(1, $first['count']);
        self::assertSame(2, $second['count']);
        self::assertSame($first['reset_at'], $second['reset_at']);
    }

    public function test_hit_resets_count_after_window_expires(): void
    {
        $storage = new PdoRateLimitStorage($this->executor);
        $storage->hit('chat:ip:127.0.0.1', 60);

        $this->executor->execute(
            'UPDATE rate_limit_buckets SET reset_at = ? WHERE bucket_key = ?',
            [time() - 1, 'chat:ip:127.0.0.1'],
        );

        $result = $storage->hit('chat:ip:127.0.0.1', 60);

        self::assertSame(1, $result['count']);
    }
}
