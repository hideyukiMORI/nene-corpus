<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

final readonly class AnalyticsSummary
{
    /**
     * @param list<DailyCount>  $dailyTrend         Past 30 days (0-filled)
     * @param list<HourlyCount> $hourlyDistribution All 24 hours (0-filled)
     */
    public function __construct(
        public int $sessionsToday,
        public int $sessionsThisWeek,
        public int $sessionsTotal,
        public int $userMessagesTotal,
        public int $assistantMessagesTotal,
        public int $inputTokensTotal,
        public int $outputTokensTotal,
        public float $avgMessagesPerSession,
        public float $citationRate,
        public array $dailyTrend,
        public array $hourlyDistribution,
    ) {
    }
}
