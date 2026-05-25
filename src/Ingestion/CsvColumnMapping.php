<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class CsvColumnMapping
{
    /**
     * @param list<string> $contentColumns
     * @param list<string> $metadataColumns
     */
    public function __construct(
        public string $titleColumn,
        public array $contentColumns,
        public array $metadataColumns = [],
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function fromArray(array $payload): self
    {
        $titleColumn = trim((string) ($payload['title_column'] ?? ''));
        $contentColumns = self::normalizeColumnList($payload['content_columns'] ?? []);
        $metadataColumns = self::normalizeColumnList($payload['metadata_columns'] ?? []);

        return new self($titleColumn, $contentColumns, $metadataColumns);
    }

    /**
     * @param mixed $value
     * @return list<string>
     */
    private static function normalizeColumnList(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }

        $columns = [];

        foreach ($value as $column) {
            if (!is_string($column)) {
                continue;
            }

            $column = trim($column);

            if ($column !== '') {
                $columns[] = $column;
            }
        }

        return $columns;
    }
}
