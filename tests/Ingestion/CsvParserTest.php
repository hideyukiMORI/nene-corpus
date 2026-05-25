<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Ingestion;

use NeneCorpus\Ingestion\CsvColumnMapping;
use NeneCorpus\Ingestion\CsvParser;
use PHPUnit\Framework\TestCase;

final class CsvParserTest extends TestCase
{
    private CsvParser $parser;

    protected function setUp(): void
    {
        $this->parser = new CsvParser();
    }

    public function test_preview_returns_headers_and_sample_rows(): void
    {
        $csv = <<<'CSV'
product_name,description,price
Widget A,Great widget,100
Widget B,Another widget,200
CSV;

        $preview = $this->parser->preview($csv);

        self::assertSame(['product_name', 'description', 'price'], $preview['headers']);
        self::assertSame(',', $preview['detected_delimiter']);
        self::assertSame(2, $preview['row_count']);
        self::assertSame([
            ['Widget A', 'Great widget', '100'],
            ['Widget B', 'Another widget', '200'],
        ], $preview['sample_rows']);
    }

    public function test_parse_rows_builds_documents_from_mapping(): void
    {
        $csv = <<<'CSV'
product_name,description,price
Widget A,Great widget,100
CSV;

        $rows = $this->parser->parseRows($csv, new CsvColumnMapping(
            titleColumn: 'product_name',
            contentColumns: ['description'],
            metadataColumns: ['price'],
        ));

        self::assertCount(1, $rows);
        self::assertSame('Widget A', $rows[0]['title']);
        self::assertSame('description: Great widget', $rows[0]['content']);
        self::assertSame(['price' => '100'], $rows[0]['metadata']);
    }

    public function test_preview_normalizes_shift_jis_bytes_to_utf8(): void
    {
        $csv = mb_convert_encoding(
            "product_name,description\nWidget A,日本語テスト\n",
            'SJIS-win',
            'UTF-8',
        );

        $preview = $this->parser->preview($csv);

        self::assertSame(['product_name', 'description'], $preview['headers']);
        self::assertSame('日本語テスト', $preview['sample_rows'][0][1]);
    }
}
