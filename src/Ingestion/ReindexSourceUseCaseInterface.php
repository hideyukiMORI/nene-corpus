<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

interface ReindexSourceUseCaseInterface
{
    public function execute(ReindexSourceInput $input): CreateSourceOutput;
}
