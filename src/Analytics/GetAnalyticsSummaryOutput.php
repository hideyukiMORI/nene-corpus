<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

final readonly class GetAnalyticsSummaryOutput
{
    public function __construct(
        public AnalyticsSummary $summary,
    ) {
    }
}
