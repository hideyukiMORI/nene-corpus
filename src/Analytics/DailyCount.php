<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

final readonly class DailyCount
{
    public function __construct(
        /** YYYY-MM-DD */
        public string $date,
        public int $sessions,
        public int $messages,
    ) {
    }
}
