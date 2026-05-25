<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

interface CreateCsvSourceUseCaseInterface
{
    public function execute(CreateCsvSourceInput $input): CreateSourceOutput;
}
