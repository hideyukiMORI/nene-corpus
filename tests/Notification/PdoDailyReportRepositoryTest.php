<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Notification;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Notification\PdoDailyReportRepository;
use NeneCorpus\Tests\Support\ChatSchemaSetup;
use NeneCorpus\Tests\Support\RateLimitSchemaSetup;
use PHPUnit\Framework\TestCase;

final class PdoDailyReportRepositoryTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;
    private PdoDailyReportRepository $repo;

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

        ChatSchemaSetup::create($this->executor);
        RateLimitSchemaSetup::create($this->executor);

        $this->repo = new PdoDailyReportRepository($this->executor);
    }

    public function test_returns_zeros_for_empty_database(): void
    {
        $stats = $this->repo->getStats('2026-01-15');

        self::assertSame('2026-01-15', $stats->reportDate);
        self::assertSame(0, $stats->totalSessions);
        self::assertSame(0, $stats->totalMessages);
        self::assertSame(0, $stats->uniqueIps);
        self::assertSame(0, $stats->rateLimitHits);
    }

    public function test_counts_sessions_on_target_date(): void
    {
        $this->insertSession('2026-01-15 10:00:00', 'tok1', '1.1.1.1');
        $this->insertSession('2026-01-15 14:30:00', 'tok2', '2.2.2.2');

        $stats = $this->repo->getStats('2026-01-15');

        self::assertSame(2, $stats->totalSessions);
    }

    public function test_excludes_sessions_outside_target_date(): void
    {
        $this->insertSession('2026-01-14 23:59:59', 'tok-prev', '1.1.1.1');
        $this->insertSession('2026-01-15 10:00:00', 'tok-today', '2.2.2.2');
        $this->insertSession('2026-01-16 00:00:00', 'tok-next', '3.3.3.3');

        $stats = $this->repo->getStats('2026-01-15');

        self::assertSame(1, $stats->totalSessions);
    }

    public function test_counts_messages_on_target_date(): void
    {
        $sessionId = $this->insertSession('2026-01-15 10:00:00', 'tok1', '1.1.1.1');
        $this->insertMessage($sessionId, '2026-01-15 10:01:00');
        $this->insertMessage($sessionId, '2026-01-15 10:02:00');
        $this->insertMessage($sessionId, '2026-01-15 10:03:00');

        $stats = $this->repo->getStats('2026-01-15');

        self::assertSame(3, $stats->totalMessages);
    }

    public function test_excludes_messages_outside_target_date(): void
    {
        $sessionId = $this->insertSession('2026-01-14 10:00:00', 'tok1', '1.1.1.1');
        $this->insertMessage($sessionId, '2026-01-14 10:01:00'); // yesterday
        $sessionId2 = $this->insertSession('2026-01-15 10:00:00', 'tok2', '2.2.2.2');
        $this->insertMessage($sessionId2, '2026-01-15 11:00:00'); // today

        $stats = $this->repo->getStats('2026-01-15');

        self::assertSame(1, $stats->totalMessages);
    }

    public function test_counts_unique_ips(): void
    {
        $this->insertSession('2026-01-15 10:00:00', 'tok1', '1.1.1.1');
        $this->insertSession('2026-01-15 11:00:00', 'tok2', '1.1.1.1'); // same IP
        $this->insertSession('2026-01-15 12:00:00', 'tok3', '2.2.2.2'); // different IP

        $stats = $this->repo->getStats('2026-01-15');

        self::assertSame(2, $stats->uniqueIps);
    }

    public function test_counts_rate_limit_hits_from_bucket(): void
    {
        $today = '2026-01-15';
        $this->executor->execute(
            'INSERT INTO rate_limit_buckets (bucket_key, hit_count, reset_at, updated_at) VALUES (?, ?, ?, ?)',
            ["notify:ratelimit:hits:{$today}", 17, time() + 86400, '2026-01-15 10:00:00'],
        );

        $stats = $this->repo->getStats($today);

        self::assertSame(17, $stats->rateLimitHits);
    }

    public function test_rate_limit_hits_zero_when_bucket_missing(): void
    {
        $stats = $this->repo->getStats('2026-01-15');

        self::assertSame(0, $stats->rateLimitHits);
    }

    public function test_rate_limit_hits_from_different_date_not_counted(): void
    {
        $this->executor->execute(
            'INSERT INTO rate_limit_buckets (bucket_key, hit_count, reset_at, updated_at) VALUES (?, ?, ?, ?)',
            ['notify:ratelimit:hits:2026-01-14', 99, time() + 86400, '2026-01-14 00:00:00'],
        );

        $stats = $this->repo->getStats('2026-01-15');

        self::assertSame(0, $stats->rateLimitHits);
    }

    // ------------------------------------------------------------------ helpers

    private function insertSession(string $createdAt, string $token, string $ip): int
    {
        $this->executor->execute(
            'INSERT INTO chat_sessions (public_token, client_ip, user_agent, referer, created_at, updated_at)
             VALUES (?, ?, NULL, NULL, ?, ?)',
            [$token, $ip, $createdAt, $createdAt],
        );

        $row = $this->executor->fetchOne('SELECT last_insert_rowid() AS id', []);

        return (int) ($row['id'] ?? 0);
    }

    private function insertMessage(int $sessionId, string $createdAt): void
    {
        $this->executor->execute(
            'INSERT INTO chat_messages (session_id, role, content, citations_json, created_at, updated_at)
             VALUES (?, ?, ?, NULL, ?, ?)',
            [$sessionId, 'user', 'hello', $createdAt, $createdAt],
        );
    }
}
