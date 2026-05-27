<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

final readonly class GetAnalyticsSummaryInput
{
    public function __construct(
        public int $trendDays = 30,
    ) {
    }
}
