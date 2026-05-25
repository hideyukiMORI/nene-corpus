<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Ingestion;

use NeneCorpus\Ingestion\PdfTextExtractor;
use NeneCorpus\Tests\Support\SampleTextPdf;
use PHPUnit\Framework\TestCase;

final class PdfTextExtractorTest extends TestCase
{
    public function test_extract_pages_returns_text_for_sample_pdf(): void
    {
        $extractor = new PdfTextExtractor();
        $pages = $extractor->extractPages(SampleTextPdf::bytes());

        self::assertNotEmpty($pages);
        self::assertSame(1, $pages[0]['page_number']);
        self::assertStringContainsString('Sample PDF', $pages[0]['text']);
    }

    public function test_preview_returns_page_count_and_sample_text(): void
    {
        $extractor = new PdfTextExtractor();
        $preview = $extractor->preview(SampleTextPdf::bytes());

        self::assertSame(1, $preview['page_count']);
        self::assertStringContainsString('Sample PDF', $preview['sample_text']);
    }
}
