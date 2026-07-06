<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

use DateTimeImmutable;
use Nene2\Http\ClockInterface;

/**
 * Deterministic {@see ClockInterface} for tests: always returns the instant it
 * was constructed with (defaulting to a fixed UTC moment). Lets time-boundary
 * behaviour (expiry windows, `reset_at`, daily trend dates) be asserted without
 * wall-clock flakiness.
 */
final class FixedClock implements ClockInterface
{
    private DateTimeImmutable $now;

    public function __construct(string $instant = '2026-01-15T12:00:00Z')
    {
        $this->now = new DateTimeImmutable($instant);
    }

    public function now(): DateTimeImmutable
    {
        return $this->now;
    }
}
