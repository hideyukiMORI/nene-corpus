<?php

declare(strict_types=1);

namespace NeneCorpus\RateLimit;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\ClockInterface;
use Nene2\Middleware\RateLimitStorageInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

final readonly class PdoRateLimitStorage implements RateLimitStorageInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedOrgIdHolder $orgIdHolder,
        private ClockInterface $clock,
    ) {
    }

    public function hit(string $key, int $windowSeconds): array
    {
        $orgId = $this->orgId();
        $now   = $this->clock->now()->getTimestamp();
        $row   = $this->query->fetchOne(
            'SELECT hit_count, reset_at FROM rate_limit_buckets WHERE organization_id = ? AND bucket_key = ?',
            [$orgId, $key],
        );

        if ($row === null) {
            $resetAt = $now + $windowSeconds;

            $this->query->execute(
                'INSERT INTO rate_limit_buckets (organization_id, bucket_key, hit_count, reset_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                [$orgId, $key, 1, $resetAt, $this->now()],
            );

            return ['count' => 1, 'reset_at' => $resetAt];
        }

        $resetAt = (int) $row['reset_at'];

        if ($resetAt <= $now) {
            $resetAt = $now + $windowSeconds;

            $this->query->execute(
                'UPDATE rate_limit_buckets SET hit_count = ?, reset_at = ?, updated_at = ? WHERE organization_id = ? AND bucket_key = ?',
                [1, $resetAt, $this->now(), $orgId, $key],
            );

            return ['count' => 1, 'reset_at' => $resetAt];
        }

        $count = (int) $row['hit_count'] + 1;

        $this->query->execute(
            'UPDATE rate_limit_buckets SET hit_count = ?, updated_at = ? WHERE organization_id = ? AND bucket_key = ?',
            [$count, $this->now(), $orgId, $key],
        );

        return ['count' => $count, 'reset_at' => $resetAt];
    }

    /**
     * Rate-limit buckets fall back to org_id = 0 for bypass paths
     * (login / password-reset / health / install) where no tenant context is resolved.
     * org_id = 0 is reserved for global (non-tenant) buckets and won't collide with real orgs (1+).
     */
    private function orgId(): int
    {
        return $this->orgIdHolder->getId() ?? 0;
    }

    private function now(): string
    {
        return $this->clock->now()->format('Y-m-d H:i:s');
    }
}
