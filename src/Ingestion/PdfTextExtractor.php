<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use Smalot\PdfParser\Parser;

final readonly class PdfTextExtractor
{
    private const SAMPLE_TEXT_LIMIT = 500;

    public function __construct(
        private Parser $parser = new Parser(),
    ) {
    }

    /**
     * @return array{page_count: int, sample_text: string}
     */
    public function preview(string $bytes): array
    {
        $pages = $this->extractPages($bytes);

        $sampleText = $pages[0]['text'];

        if (mb_strlen($sampleText) > self::SAMPLE_TEXT_LIMIT) {
            $sampleText = mb_substr($sampleText, 0, self::SAMPLE_TEXT_LIMIT) . '…';
        }

        return [
            'page_count' => count($pages),
            'sample_text' => $sampleText,
        ];
    }

    /**
     * @return list<array{page_number: int, text: string}>
     */
    public function extractPages(string $bytes): array
    {
        try {
            $document = $this->parser->parseContent($bytes);
        } catch (\Throwable) {
            throw new CsvIngestionException('PDF file could not be parsed.', 'content');
        }

        $pages = [];
        $pageNumber = 0;

        foreach ($document->getPages() as $page) {
            ++$pageNumber;
            $text = trim(preg_replace('/\s+/u', ' ', $page->getText()) ?? '');

            if ($text === '') {
                continue;
            }

            $pages[] = [
                'page_number' => $pageNumber,
                'text' => $text,
            ];
        }

        if ($pages === []) {
            throw new CsvIngestionException(
                'PDF contains no extractable text. Scanned PDFs are not supported in Phase 1.',
                'content',
            );
        }

        return $pages;
    }
}
