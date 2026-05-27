<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

final readonly class HourlyCount
{
    public function __construct(
        /** 0–23 */
        public int $hour,
        public int $sessions,
    ) {
    }
}
