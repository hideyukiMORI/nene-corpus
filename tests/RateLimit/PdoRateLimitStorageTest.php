<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\RateLimit;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\RateLimit\PdoRateLimitStorage;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\FixedClock;
use NeneCorpus\Tests\Support\RateLimitSchemaSetup;
use PHPUnit\Framework\TestCase;

final class PdoRateLimitStorageTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;
    private RequestScopedOrgIdHolder $holder;

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

        $this->holder = new RequestScopedOrgIdHolder();
        $this->holder->setId(1);
    }

    public function test_hit_increments_count_within_window(): void
    {
        $storage = new PdoRateLimitStorage($this->executor, $this->holder, new FixedClock());

        $first  = $storage->hit('chat:session:abc', 60);
        $second = $storage->hit('chat:session:abc', 60);

        self::assertSame(1, $first['count']);
        self::assertSame(2, $second['count']);
        self::assertSame($first['reset_at'], $second['reset_at']);
    }

    public function test_hit_resets_count_after_window_expires(): void
    {
        $storage = new PdoRateLimitStorage($this->executor, $this->holder, new FixedClock());
        $storage->hit('chat:ip:127.0.0.1', 60);

        $this->executor->execute(
            'UPDATE rate_limit_buckets SET reset_at = ? WHERE organization_id = ? AND bucket_key = ?',
            [1, 1, 'chat:ip:127.0.0.1'],
        );

        $result = $storage->hit('chat:ip:127.0.0.1', 60);

        self::assertSame(1, $result['count']);
    }

    public function test_hit_is_isolated_per_organization(): void
    {
        $holderOrg1 = new RequestScopedOrgIdHolder();
        $holderOrg1->setId(1);
        $storageOrg1 = new PdoRateLimitStorage($this->executor, $holderOrg1, new FixedClock());

        $holderOrg2 = new RequestScopedOrgIdHolder();
        $holderOrg2->setId(2);
        $storageOrg2 = new PdoRateLimitStorage($this->executor, $holderOrg2, new FixedClock());

        // Org 1 hits twice, org 2 hits once with the same key
        $storageOrg1->hit('chat:session:xyz', 60);
        $storageOrg1->hit('chat:session:xyz', 60);
        $resultOrg2 = $storageOrg2->hit('chat:session:xyz', 60);

        // Org 2 must start at 1 — not influenced by org 1's count
        self::assertSame(1, $resultOrg2['count']);
    }
}
