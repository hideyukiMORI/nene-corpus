<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

interface CreatePdfSourceUseCaseInterface
{
    public function execute(CreatePdfSourceInput $input): CreateSourceOutput;
}
