<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

interface GetAnalyticsSummaryUseCaseInterface
{
    public function execute(GetAnalyticsSummaryInput $input): GetAnalyticsSummaryOutput;
}
