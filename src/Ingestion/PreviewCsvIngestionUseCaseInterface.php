<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

interface PreviewCsvIngestionUseCaseInterface
{
    public function execute(PreviewCsvIngestionInput $input): PreviewCsvIngestionOutput;
}
