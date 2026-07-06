<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\AdminAuth;

use NeneCorpus\AdminAuth\AdminPasswordReset;
use NeneCorpus\Tests\Support\FixedClock;
use PHPUnit\Framework\TestCase;

/**
 * AdminPasswordReset エンティティの isExpired() / isUsed() を完全検証。
 *
 * 敵対的観点:
 *  - 期限が「ちょうど」今の場合は境界値なので expired 扱いになるかをチェック
 *  - usedAt = '' (空文字) が null と区別されるかをチェック
 *
 * isExpired() は注入された ClockInterface を基準に判定するため、固定時計
 * （FixedClock）で "now" を固定し、境界値を決定論的に検証する（wall-clock 非依存）。
 */
final class AdminPasswordResetTest extends TestCase
{
    /** 判定基準となる固定の "now"（UTC）。 */
    private const NOW = '2026-01-15 12:00:00';

    private FixedClock $clock;

    protected function setUp(): void
    {
        $this->clock = new FixedClock(self::NOW . 'Z');
    }

    /** 固定 now からの相対秒で expiresAt 文字列を作る。 */
    private function atOffset(int $seconds): string
    {
        return gmdate('Y-m-d H:i:s', strtotime(self::NOW) + $seconds);
    }

    // ── isExpired() ──────────────────────────────────────────────────

    public function test_is_expired_returns_true_for_past_date(): void
    {
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: $this->atOffset(-1),
            usedAt: null,
            createdAt: self::NOW,
        );

        self::assertTrue($reset->isExpired($this->clock));
    }

    public function test_is_expired_returns_true_for_past_date_far(): void
    {
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: '2000-01-01 00:00:00',
            usedAt: null,
            createdAt: self::NOW,
        );

        self::assertTrue($reset->isExpired($this->clock));
    }

    public function test_is_expired_returns_false_for_future_date(): void
    {
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: $this->atOffset(3600),
            usedAt: null,
            createdAt: self::NOW,
        );

        self::assertFalse($reset->isExpired($this->clock));
    }

    public function test_is_expired_returns_false_for_far_future(): void
    {
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: '2099-12-31 23:59:59',
            usedAt: null,
            createdAt: self::NOW,
        );

        self::assertFalse($reset->isExpired($this->clock));
    }

    public function test_is_expired_boundary_equal_now_is_not_expired(): void
    {
        // strtotime(expiresAt) < now → 同値は expired ではない。1 秒前は expired。
        $notYet = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: $this->atOffset(0),
            usedAt: null,
            createdAt: self::NOW,
        );

        self::assertFalse($notYet->isExpired($this->clock));

        $oneSecondAgo = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: $this->atOffset(-1),
            usedAt: null,
            createdAt: self::NOW,
        );

        self::assertTrue($oneSecondAgo->isExpired($this->clock));
    }

    // ── isUsed() ─────────────────────────────────────────────────────

    public function test_is_used_returns_false_when_used_at_is_null(): void
    {
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: $this->atOffset(3600),
            usedAt: null,
            createdAt: self::NOW,
        );

        self::assertFalse($reset->isUsed());
    }

    public function test_is_used_returns_true_when_used_at_is_set(): void
    {
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: $this->atOffset(3600),
            usedAt: self::NOW,
            createdAt: self::NOW,
        );

        self::assertTrue($reset->isUsed());
    }

    public function test_is_used_returns_true_even_when_also_expired(): void
    {
        // 期限切れかつ使用済み → 両方 true
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: '2000-01-01 00:00:00',
            usedAt: '2000-01-01 00:00:01',
            createdAt: '2000-01-01 00:00:00',
        );

        self::assertTrue($reset->isExpired($this->clock));
        self::assertTrue($reset->isUsed());
    }
}
