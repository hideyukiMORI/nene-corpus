<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

interface CreateTextSourceUseCaseInterface
{
    public function execute(CreateTextSourceInput $input): CreateSourceOutput;
}
