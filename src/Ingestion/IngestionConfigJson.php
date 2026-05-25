<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class IngestionConfigJson
{
    public static function encodeCsvMapping(CsvColumnMapping $mapping): string
    {
        return json_encode([
            'column_mapping' => [
                'title_column' => $mapping->titleColumn,
                'content_columns' => $mapping->contentColumns,
                'metadata_columns' => $mapping->metadataColumns,
            ],
        ], JSON_THROW_ON_ERROR);
    }

    public static function decodeCsvMapping(?string $json): CsvColumnMapping
    {
        if ($json === null || trim($json) === '') {
            throw new CsvIngestionException('CSV column mapping is not stored for this source.', 'column_mapping');
        }

        /** @var array<string, mixed> $decoded */
        $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        $mapping = $decoded['column_mapping'] ?? null;

        if (!is_array($mapping)) {
            throw new CsvIngestionException('CSV column mapping is not stored for this source.', 'column_mapping');
        }

        return CsvColumnMapping::fromArray($mapping);
    }
}
