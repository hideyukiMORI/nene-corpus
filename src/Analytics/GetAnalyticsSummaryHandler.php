<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class GetAnalyticsSummaryHandler
{
    public function __construct(
        private GetAnalyticsSummaryUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $output  = $this->useCase->execute(new GetAnalyticsSummaryInput());
        $summary = $output->summary;

        return $this->response->create([
            'sessions' => [
                'today'     => $summary->sessionsToday,
                'this_week' => $summary->sessionsThisWeek,
                'total'     => $summary->sessionsTotal,
            ],
            'messages' => [
                'user_total'      => $summary->userMessagesTotal,
                'assistant_total' => $summary->assistantMessagesTotal,
            ],
            'tokens' => [
                'input_total'  => $summary->inputTokensTotal,
                'output_total' => $summary->outputTokensTotal,
            ],
            'avg_messages_per_session' => $summary->avgMessagesPerSession,
            'citation_rate'            => $summary->citationRate,
            'daily_trend'              => array_map(
                static fn (DailyCount $d): array => [
                    'date'     => $d->date,
                    'sessions' => $d->sessions,
                    'messages' => $d->messages,
                ],
                $summary->dailyTrend,
            ),
            'hourly_distribution' => array_map(
                static fn (HourlyCount $h): array => [
                    'hour'     => $h->hour,
                    'sessions' => $h->sessions,
                ],
                $summary->hourlyDistribution,
            ),
        ]);
    }
}
