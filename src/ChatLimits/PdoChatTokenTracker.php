<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

use Nene2\Database\DatabaseQueryExecutorInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

/**
 * Tracks daily token usage (input + output) in rate_limit_buckets.
 *
 * Uses a 24-hour rolling window, keyed as:
 *   chat:tokens:{orgId}:ip:{ip}    — per-IP daily total (org-scoped)
 *   chat:tokens:{orgId}:global     — global daily total (org-scoped)
 *
 * hit_count stores the sum of (inputTokens + outputTokens) for each call.
 */
final readonly class PdoChatTokenTracker implements ChatTokenTrackerInterface
{
    private const DAILY_WINDOW = 86400;

    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedOrgIdHolder $orgIdHolder,
    ) {
    }

    public function track(string $ip, int $inputTokens, int $outputTokens): void
    {
        $total = $inputTokens + $outputTokens;

        if ($total <= 0) {
            return;
        }

        $orgId = $this->orgIdHolder->getId() ?? 1;

        $this->addToWindow('chat:tokens:' . $orgId . ':ip:' . $ip, $total);
        $this->addToWindow('chat:tokens:' . $orgId . ':global', $total);
    }

    public function dailyTokensForIp(string $ip): int
    {
        $orgId = $this->orgIdHolder->getId() ?? 1;

        return $this->peekWindow('chat:tokens:' . $orgId . ':ip:' . $ip);
    }

    public function dailyTokensGlobal(): int
    {
        $orgId = $this->orgIdHolder->getId() ?? 1;

        return $this->peekWindow('chat:tokens:' . $orgId . ':global');
    }

    private function addToWindow(string $key, int $amount): void
    {
        $now = time();
        $row = $this->query->fetchOne(
            'SELECT hit_count, reset_at FROM rate_limit_buckets WHERE bucket_key = ?',
            [$key],
        );

        if ($row === null) {
            $resetAt = $now + self::DAILY_WINDOW;

            $this->query->execute(
                'INSERT INTO rate_limit_buckets (bucket_key, hit_count, reset_at, updated_at) VALUES (?, ?, ?, ?)',
                [$key, $amount, $resetAt, $this->now()],
            );

            return;
        }

        $resetAt = (int) $row['reset_at'];

        if ($resetAt <= $now) {
            // Window expired — start fresh
            $this->query->execute(
                'UPDATE rate_limit_buckets SET hit_count = ?, reset_at = ?, updated_at = ? WHERE bucket_key = ?',
                [$amount, $now + self::DAILY_WINDOW, $this->now(), $key],
            );

            return;
        }

        $newCount = (int) $row['hit_count'] + $amount;

        $this->query->execute(
            'UPDATE rate_limit_buckets SET hit_count = ?, updated_at = ? WHERE bucket_key = ?',
            [$newCount, $this->now(), $key],
        );
    }

    private function peekWindow(string $key): int
    {
        $row = $this->query->fetchOne(
            'SELECT hit_count, reset_at FROM rate_limit_buckets WHERE bucket_key = ?',
            [$key],
        );

        if ($row === null) {
            return 0;
        }

        if ((int) $row['reset_at'] <= time()) {
            return 0;
        }

        return (int) $row['hit_count'];
    }

    private function now(): string
    {
        return gmdate('Y-m-d H:i:s');
    }
}
