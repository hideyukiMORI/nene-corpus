<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

interface ListSourcesUseCaseInterface
{
    public function execute(ListSourcesInput $input): ListSourcesOutput;
}
