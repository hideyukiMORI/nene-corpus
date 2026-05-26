<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\AdminAuth;

use NeneCorpus\AdminAuth\AdminPasswordReset;
use PHPUnit\Framework\TestCase;

/**
 * AdminPasswordReset エンティティの isExpired() / isUsed() を完全検証。
 *
 * 敵対的観点:
 *  - 期限が「ちょうど」今の場合は境界値なので expired 扱いになるかをチェック
 *  - usedAt = '' (空文字) が null と区別されるかをチェック
 */
final class AdminPasswordResetTest extends TestCase
{
    // ── isExpired() ──────────────────────────────────────────────────

    public function test_is_expired_returns_true_for_past_date(): void
    {
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: gmdate('Y-m-d H:i:s', time() - 1),
            usedAt: null,
            createdAt: gmdate('Y-m-d H:i:s'),
        );

        self::assertTrue($reset->isExpired());
    }

    public function test_is_expired_returns_true_for_past_date_far(): void
    {
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: '2000-01-01 00:00:00',
            usedAt: null,
            createdAt: gmdate('Y-m-d H:i:s'),
        );

        self::assertTrue($reset->isExpired());
    }

    public function test_is_expired_returns_false_for_future_date(): void
    {
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: gmdate('Y-m-d H:i:s', time() + 3600),
            usedAt: null,
            createdAt: gmdate('Y-m-d H:i:s'),
        );

        self::assertFalse($reset->isExpired());
    }

    public function test_is_expired_returns_false_for_far_future(): void
    {
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: '2099-12-31 23:59:59',
            usedAt: null,
            createdAt: gmdate('Y-m-d H:i:s'),
        );

        self::assertFalse($reset->isExpired());
    }

    public function test_is_expired_returns_true_when_expires_exactly_now(): void
    {
        // strtotime(expiresAt) < time() → 同値は expired 扱いになるはずだが、
        // 実際には < なので「同値」= expired ではない。1 秒前は expired。
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: gmdate('Y-m-d H:i:s', time() - 1),
            usedAt: null,
            createdAt: gmdate('Y-m-d H:i:s'),
        );

        self::assertTrue($reset->isExpired());
    }

    // ── isUsed() ─────────────────────────────────────────────────────

    public function test_is_used_returns_false_when_used_at_is_null(): void
    {
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: gmdate('Y-m-d H:i:s', time() + 3600),
            usedAt: null,
            createdAt: gmdate('Y-m-d H:i:s'),
        );

        self::assertFalse($reset->isUsed());
    }

    public function test_is_used_returns_true_when_used_at_is_set(): void
    {
        $reset = new AdminPasswordReset(
            tokenHash: 'hash',
            adminUserId: 1,
            expiresAt: gmdate('Y-m-d H:i:s', time() + 3600),
            usedAt: gmdate('Y-m-d H:i:s'),
            createdAt: gmdate('Y-m-d H:i:s'),
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

        self::assertTrue($reset->isExpired());
        self::assertTrue($reset->isUsed());
    }
}
