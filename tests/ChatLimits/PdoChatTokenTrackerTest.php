<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\ChatLimits;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\ChatLimits\PdoChatTokenTracker;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\RateLimitSchemaSetup;
use PHPUnit\Framework\TestCase;

/**
 * PdoChatTokenTracker の敵対的テスト。
 *
 * 重点チェック:
 *  - ゼロトークンでは DB への書き込みなし
 *  - 正のトークン → バケット作成・累積
 *  - 複数回 track → 加算される
 *  - IP とグローバルは独立したバケット
 *  - ウィンドウ期限切れ後は 0 から再開
 *  - peek 時点でウィンドウが切れていれば 0 を返す
 */
final class PdoChatTokenTrackerTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;
    private RequestScopedOrgIdHolder $orgIdHolder;
    private PdoChatTokenTracker $tracker;

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

        $this->orgIdHolder = new RequestScopedOrgIdHolder();
        $this->orgIdHolder->setId(1);
        $this->tracker = new PdoChatTokenTracker($this->executor, $this->orgIdHolder);
    }

    // ── ゼロトークン ──────────────────────────────────────────────────

    public function test_track_does_not_write_to_db_when_both_tokens_are_zero(): void
    {
        $this->tracker->track('1.2.3.4', 0, 0);

        $countRow = $this->executor->fetchOne('SELECT COUNT(*) AS c FROM rate_limit_buckets');
        self::assertNotNull($countRow);
        self::assertSame(0, (int) $countRow['c'], 'ゼロトークンでは DB 書き込みなし');
    }

    public function test_track_does_not_write_when_only_input_is_zero(): void
    {
        $this->tracker->track('1.2.3.4', 0, 0);

        self::assertSame(0, $this->tracker->dailyTokensForIp('1.2.3.4'));
        self::assertSame(0, $this->tracker->dailyTokensGlobal());
    }

    // ── バケット作成・累積 ────────────────────────────────────────────

    public function test_track_creates_bucket_on_first_call(): void
    {
        $this->tracker->track('10.0.0.1', 100, 50);

        self::assertSame(150, $this->tracker->dailyTokensForIp('10.0.0.1'));
        self::assertSame(150, $this->tracker->dailyTokensGlobal());
    }

    public function test_track_accumulates_across_multiple_calls(): void
    {
        $this->tracker->track('10.0.0.1', 100, 50);
        $this->tracker->track('10.0.0.1', 200, 75);

        self::assertSame(425, $this->tracker->dailyTokensForIp('10.0.0.1'));
        self::assertSame(425, $this->tracker->dailyTokensGlobal());
    }

    public function test_track_global_accumulates_across_different_ips(): void
    {
        $this->tracker->track('10.0.0.1', 100, 0);
        $this->tracker->track('10.0.0.2', 200, 0);

        // IP バケットは独立
        self::assertSame(100, $this->tracker->dailyTokensForIp('10.0.0.1'));
        self::assertSame(200, $this->tracker->dailyTokensForIp('10.0.0.2'));

        // グローバルは合算
        self::assertSame(300, $this->tracker->dailyTokensGlobal());
    }

    // ── peek 初期値 ───────────────────────────────────────────────────

    public function test_daily_tokens_for_ip_returns_zero_for_unknown_ip(): void
    {
        self::assertSame(0, $this->tracker->dailyTokensForIp('192.168.99.99'));
    }

    public function test_daily_tokens_global_returns_zero_when_no_data(): void
    {
        self::assertSame(0, $this->tracker->dailyTokensGlobal());
    }

    // ── ウィンドウ期限切れ ────────────────────────────────────────────

    public function test_peek_returns_zero_when_window_is_expired(): void
    {
        // reset_at を過去に設定した期限切れバケットを手動挿入
        $now = gmdate('Y-m-d H:i:s');
        $this->executor->execute(
            'INSERT INTO rate_limit_buckets (bucket_key, hit_count, reset_at, updated_at) VALUES (?, ?, ?, ?)',
            ['chat:tokens:ip:5.5.5.5', 9999, time() - 1, $now],
        );
        $this->executor->execute(
            'INSERT INTO rate_limit_buckets (bucket_key, hit_count, reset_at, updated_at) VALUES (?, ?, ?, ?)',
            ['chat:tokens:global', 9999, time() - 1, $now],
        );

        // 期限切れバケットは 0 として返す
        self::assertSame(0, $this->tracker->dailyTokensForIp('5.5.5.5'));
        self::assertSame(0, $this->tracker->dailyTokensGlobal());
    }

    public function test_track_resets_count_when_window_is_expired(): void
    {
        // 期限切れバケットを手動挿入
        $now = gmdate('Y-m-d H:i:s');
        $this->executor->execute(
            'INSERT INTO rate_limit_buckets (bucket_key, hit_count, reset_at, updated_at) VALUES (?, ?, ?, ?)',
            ['chat:tokens:ip:6.6.6.6', 9999, time() - 1, $now],
        );

        // 新しくトークンを track → リセットして 100 になる（9999 に加算されない）
        $this->tracker->track('6.6.6.6', 100, 0);

        self::assertSame(100, $this->tracker->dailyTokensForIp('6.6.6.6'));
    }

    // ── 入力トークンのみ / 出力トークンのみ ──────────────────────────

    public function test_track_with_only_input_tokens(): void
    {
        $this->tracker->track('7.7.7.7', 500, 0);

        self::assertSame(500, $this->tracker->dailyTokensForIp('7.7.7.7'));
    }

    public function test_track_with_only_output_tokens(): void
    {
        $this->tracker->track('8.8.8.8', 0, 300);

        self::assertSame(300, $this->tracker->dailyTokensForIp('8.8.8.8'));
    }
}
