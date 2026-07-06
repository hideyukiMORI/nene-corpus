<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

use Nene2\Http\ClockInterface;

final readonly class GetAnalyticsSummaryUseCase implements GetAnalyticsSummaryUseCaseInterface
{
    public function __construct(
        private AnalyticsRepositoryInterface $repo,
        private ClockInterface $clock,
    ) {
    }

    public function execute(GetAnalyticsSummaryInput $input): GetAnalyticsSummaryOutput
    {
        $summary = new AnalyticsSummary(
            sessionsToday:           $this->repo->countSessionsToday(),
            sessionsThisWeek:        $this->repo->countSessionsThisWeek(),
            sessionsTotal:           $this->repo->countSessionsTotal(),
            userMessagesTotal:       $this->repo->countMessagesByRole('user'),
            assistantMessagesTotal:  $this->repo->countMessagesByRole('assistant'),
            inputTokensTotal:        $this->repo->sumTokens('input_tokens'),
            outputTokensTotal:       $this->repo->sumTokens('output_tokens'),
            avgMessagesPerSession:   $this->repo->avgMessagesPerSession(),
            citationRate:            $this->repo->citationRate(),
            dailyTrend:              $this->buildDailyTrend($input->trendDays),
            hourlyDistribution:      $this->buildHourlyDistribution(),
        );

        return new GetAnalyticsSummaryOutput($summary);
    }

    /** @return list<DailyCount> */
    private function buildDailyTrend(int $days): array
    {
        $raw = $this->repo->dailyTrendRaw($days);

        // Index raw data by date for O(1) lookup
        $byDate = [];
        foreach ($raw as $row) {
            $byDate[$row['date']] = $row;
        }

        // Fill all dates in range with 0 for missing ones
        $result = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = gmdate('Y-m-d', $this->clock->now()->getTimestamp() - $i * 86400);
            $data = $byDate[$date] ?? null;

            $result[] = new DailyCount(
                date:     $date,
                sessions: $data !== null ? (int) $data['sessions'] : 0,
                messages: $data !== null ? (int) $data['messages'] : 0,
            );
        }

        return $result;
    }

    /** @return list<HourlyCount> */
    private function buildHourlyDistribution(): array
    {
        $raw = $this->repo->hourlyDistributionRaw();

        // Index by hour
        $byHour = [];
        foreach ($raw as $row) {
            $byHour[(int) $row['hour']] = (int) $row['sessions'];
        }

        // All 24 hours, 0-filled
        $result = [];

        for ($h = 0; $h < 24; $h++) {
            $result[] = new HourlyCount(hour: $h, sessions: $byHour[$h] ?? 0);
        }

        return $result;
    }
}
