<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Unit\Upstream;

use NeneCorpus\Upstream\NullNeneRecordsClient;
use PHPUnit\Framework\TestCase;

final class NullNeneRecordsClientTest extends TestCase
{
    private NullNeneRecordsClient $client;

    protected function setUp(): void
    {
        $this->client = new NullNeneRecordsClient();
    }

    public function test_search_returns_empty_array(): void
    {
        self::assertSame([], $this->client->searchEntities('anything'));
    }

    public function test_get_record_returns_null(): void
    {
        self::assertNull($this->client->getRecord('blog', 'some-post'));
    }

    public function test_ping_returns_false(): void
    {
        self::assertFalse($this->client->ping());
    }
}
