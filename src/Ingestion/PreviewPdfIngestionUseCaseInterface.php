<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

interface PreviewPdfIngestionUseCaseInterface
{
    public function execute(PreviewPdfIngestionInput $input): PreviewPdfIngestionOutput;
}
