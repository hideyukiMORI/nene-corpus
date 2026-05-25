<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

interface ListSourcesUseCaseInterface
{
    /** @return list<SourceSummary> */
    public function execute(ListSourcesInput $input): array;
}
