<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class PreviewPdfIngestionUseCase implements PreviewPdfIngestionUseCaseInterface
{
    public function __construct(
        private PdfUploadValidator $validator,
        private PdfTextExtractor $extractor,
    ) {
    }

    public function execute(PreviewPdfIngestionInput $input): PreviewPdfIngestionOutput
    {
        $file = $this->validator->decode($input->content, $input->filename);
        $preview = $this->extractor->preview($file->bytes);

        return new PreviewPdfIngestionOutput(
            pageCount: $preview['page_count'],
            sampleText: $preview['sample_text'],
        );
    }
}
