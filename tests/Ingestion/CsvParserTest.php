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

    public function test_preview_handles_ascii_header_with_shift_jis_product_rows(): void
    {
        $header = 'ID,Type,SKU,Name,Published,Description';
        $row = mb_convert_encoding('1,simple,SKU-1,Widget,1,日本語の商品説明', 'SJIS-win', 'UTF-8');
        $csv = $header . "\n" . $row . "\n";

        $preview = $this->parser->preview($csv);

        self::assertSame(
            ['ID', 'Type', 'SKU', 'Name', 'Published', 'Description'],
            $preview['headers'],
        );
        self::assertSame('日本語の商品説明', $preview['sample_rows'][0][5]);
    }

    public function test_preview_scrubs_invalid_utf8_sequences(): void
    {
        $csv = "product_name,description\nWidget,\xED\xA0\x80broken\n";

        $preview = $this->parser->preview($csv);

        self::assertSame(['product_name', 'description'], $preview['headers']);
        self::assertSame(1, $preview['row_count']);
    }

    public function test_preview_preserves_utf8_woocommerce_headers(): void
    {
        $csv = <<<'CSV'
ID,タイプ,SKU,名前,注意事項,配送クラス
47,simple,2019-s0030940-01,オオタニヨシミ A3ポスター「花の玉章」,説明文,通常
CSV;

        $preview = $this->parser->preview($csv);

        self::assertSame(
            ['ID', 'タイプ', 'SKU', '名前', '注意事項', '配送クラス'],
            $preview['headers'],
        );
        self::assertSame('オオタニヨシミ A3ポスター「花の玉章」', $preview['sample_rows'][0][3]);
    }

    public function test_preview_does_not_mojibake_utf8_headers_with_invalid_byte_in_row(): void
    {
        $csv = "ID,タイプ,注意事項,配送クラス\n1,simple,\xED\xA0\x80,通常\n";

        $preview = $this->parser->preview($csv);

        self::assertSame('注意事項', $preview['headers'][2]);
        self::assertSame('配送クラス', $preview['headers'][3]);
        self::assertStringNotContainsString('æ', $preview['headers'][2]);
    }
}
