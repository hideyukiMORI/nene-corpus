<?php

declare(strict_types=1);

namespace NeneCorpus\RateLimit;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Middleware\RateLimitStorageInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

final readonly class PdoRateLimitStorage implements RateLimitStorageInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedOrgIdHolder $orgIdHolder,
    ) {
    }

    public function hit(string $key, int $windowSeconds): array
    {
        $orgId = $this->orgId();
        $now   = time();
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

    private function orgId(): int
    {
        $id = $this->orgIdHolder->getId();

        if ($id === null) {
            throw new LogicException('Organization ID is not resolved. Check OrgResolverMiddleware setup.');
        }

        return $id;
    }

    private function now(): string
    {
        return gmdate('Y-m-d H:i:s');
    }
}
