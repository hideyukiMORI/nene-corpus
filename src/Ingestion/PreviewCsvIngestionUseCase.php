<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class PreviewCsvIngestionUseCase implements PreviewCsvIngestionUseCaseInterface
{
    public function __construct(
        private CsvUploadValidator $validator,
        private CsvParser $parser,
    ) {
    }

    public function execute(PreviewCsvIngestionInput $input): PreviewCsvIngestionOutput
    {
        $file = $this->validator->decode($input->content, $input->filename);
        $preview = $this->parser->preview($file->bytes);

        return new PreviewCsvIngestionOutput(
            headers: $preview['headers'],
            sampleRows: $preview['sample_rows'],
            detectedDelimiter: $preview['detected_delimiter'],
            rowCount: $preview['row_count'],
        );
    }
}
