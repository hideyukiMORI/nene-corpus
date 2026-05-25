<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class CsvParser
{
    private const SAMPLE_ROW_LIMIT = 5;

    public function __construct(
        private CsvTextNormalizer $textNormalizer = new CsvTextNormalizer(),
    ) {
    }

    /**
     * @return array{
     *     headers: list<string>,
     *     sample_rows: list<list<string>>,
     *     detected_delimiter: string,
     *     row_count: int
     * }
     */
    public function preview(string $bytes): array
    {
        $rows = $this->readRows($bytes);

        if ($rows === []) {
            throw new CsvIngestionException('CSV file contains no rows.', 'content');
        }

        $headers = array_map(strval(...), array_shift($rows));
        $headers = $this->normalizeHeaders($headers);

        if ($headers === []) {
            throw new CsvIngestionException('CSV header row is empty.', 'content');
        }

        $sampleRows = [];

        foreach (array_slice($rows, 0, self::SAMPLE_ROW_LIMIT) as $row) {
            $sampleRows[] = array_values($this->alignRow($headers, $row));
        }

        return [
            'headers' => $headers,
            'sample_rows' => $sampleRows,
            'detected_delimiter' => $this->detectDelimiter($bytes),
            'row_count' => count($rows),
        ];
    }

    /**
     * @return list<array{title: string, content: string, metadata: array<string, string>}>
     */
    public function parseRows(string $bytes, CsvColumnMapping $mapping): array
    {
        $preview = $this->preview($bytes);
        $headers = $preview['headers'];
        $this->assertMapping($mapping, $headers);

        $rows = $this->readRows($bytes);
        array_shift($rows);

        $parsed = [];

        foreach ($rows as $index => $row) {
            $aligned = $this->alignRow($headers, $row);
            $record = $this->rowToRecord($aligned, $mapping, $index + 1);

            if ($record !== null) {
                $parsed[] = $record;
            }
        }

        if ($parsed === []) {
            throw new CsvIngestionException('CSV file contains no ingestible data rows.', 'content');
        }

        return $parsed;
    }

    /**
     * @param list<string> $headers
     */
    private function assertMapping(CsvColumnMapping $mapping, array $headers): void
    {
        if ($mapping->titleColumn === '') {
            throw new CsvIngestionException('Title column is required.', 'column_mapping.title_column');
        }

        if ($mapping->contentColumns === []) {
            throw new CsvIngestionException('At least one content column is required.', 'column_mapping.content_columns');
        }

        $missing = [];

        foreach ([$mapping->titleColumn, ...$mapping->contentColumns, ...$mapping->metadataColumns] as $column) {
            if (!in_array($column, $headers, true)) {
                $missing[] = $column;
            }
        }

        if ($missing !== []) {
            throw new CsvIngestionException(
                'Column mapping references unknown headers: ' . implode(', ', array_unique($missing)) . '.',
                'column_mapping',
            );
        }
    }

    /**
     * @param array<string, string> $row
     * @return array{title: string, content: string, metadata: array<string, string>}|null
     */
    private function rowToRecord(array $row, CsvColumnMapping $mapping, int $position): ?array
    {
        $title = trim($row[$mapping->titleColumn] ?? '');

        $contentParts = [];

        foreach ($mapping->contentColumns as $column) {
            $value = trim($row[$column] ?? '');

            if ($value !== '') {
                $contentParts[] = $column . ': ' . $value;
            }
        }

        $content = implode("\n", $contentParts);

        if ($title === '' && $content === '') {
            return null;
        }

        if ($title === '') {
            $title = 'Row ' . $position;
        }

        $metadata = [];

        foreach ($mapping->metadataColumns as $column) {
            $metadata[$column] = $row[$column] ?? '';
        }

        return [
            'title' => $title,
            'content' => $content !== '' ? $content : $title,
            'metadata' => $metadata,
        ];
    }

    /**
     * @return list<list<string>>
     */
    private function readRows(string $bytes): array
    {
        $bytes = $this->textNormalizer->normalize($bytes);
        $delimiter = $this->detectDelimiter($bytes);
        $lines = preg_split('/\R/', $bytes) ?: [];
        $rows = [];

        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }

            $row = str_getcsv($line, $delimiter, '"', '\\');
            $normalized = array_map(static fn (mixed $value): string => trim((string) $value), $row);

            if (implode('', $normalized) === '') {
                continue;
            }

            $rows[] = $normalized;
        }

        return $rows;
    }

    private function detectDelimiter(string $bytes): string
    {
        $firstLine = strtok($bytes, "\r\n");

        if ($firstLine === false) {
            return ',';
        }

        $best = ',';
        $bestCount = 0;

        foreach ([',', ';', "\t"] as $delimiter) {
            $count = substr_count($firstLine, $delimiter);

            if ($count > $bestCount) {
                $bestCount = $count;
                $best = $delimiter;
            }
        }

        return $best;
    }

    /**
     * @param list<string> $headers
     * @param list<string> $row
     * @return array<string, string>
     */
    private function alignRow(array $headers, array $row): array
    {
        $aligned = [];

        foreach ($headers as $index => $header) {
            $aligned[$header] = $row[$index] ?? '';
        }

        return $aligned;
    }

    /**
     * @param list<string> $headers
     * @return list<string>
     */
    private function normalizeHeaders(array $headers): array
    {
        $normalized = [];

        foreach ($headers as $header) {
            $header = trim($header);

            if ($header !== '') {
                $normalized[] = $header;
            }
        }

        return $normalized;
    }
}
