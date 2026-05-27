<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

interface GetTopQuestionsUseCaseInterface
{
    public function execute(GetTopQuestionsInput $input): GetTopQuestionsOutput;
}
