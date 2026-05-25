<?php

declare(strict_types=1);

namespace NeneCorpus\RateLimit;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Middleware\RateLimitStorageInterface;

final readonly class PdoRateLimitStorage implements RateLimitStorageInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function hit(string $key, int $windowSeconds): array
    {
        $now = time();
        $row = $this->query->fetchOne(
            'SELECT hit_count, reset_at FROM rate_limit_buckets WHERE bucket_key = ?',
            [$key],
        );

        if ($row === null) {
            $resetAt = $now + $windowSeconds;

            $this->query->execute(
                'INSERT INTO rate_limit_buckets (bucket_key, hit_count, reset_at, updated_at) VALUES (?, ?, ?, ?)',
                [$key, 1, $resetAt, $this->now()],
            );

            return ['count' => 1, 'reset_at' => $resetAt];
        }

        $resetAt = (int) $row['reset_at'];

        if ($resetAt <= $now) {
            $resetAt = $now + $windowSeconds;

            $this->query->execute(
                'UPDATE rate_limit_buckets SET hit_count = ?, reset_at = ?, updated_at = ? WHERE bucket_key = ?',
                [1, $resetAt, $this->now(), $key],
            );

            return ['count' => 1, 'reset_at' => $resetAt];
        }

        $count = (int) $row['hit_count'] + 1;

        $this->query->execute(
            'UPDATE rate_limit_buckets SET hit_count = ?, updated_at = ? WHERE bucket_key = ?',
            [$count, $this->now(), $key],
        );

        return ['count' => $count, 'reset_at' => $resetAt];
    }

    private function now(): string
    {
        return gmdate('Y-m-d H:i:s');
    }
}
