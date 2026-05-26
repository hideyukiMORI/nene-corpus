<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

final readonly class DailyReportStats
{
    public function __construct(
        public string $reportDate,
        public int $totalSessions,
        public int $totalMessages,
        public int $uniqueIps,
        public int $rateLimitHits,
    ) {
    }
}
