<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

use InvalidArgumentException;
use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoSourceRepository implements SourceRepositoryInterface
{
    private const SELECT_COLUMNS = <<<'SQL'
        id, name, source_type, status, storage_path, original_filename, mime_type,
        byte_size, error_message, ingestion_config_json, created_at, updated_at, is_deleted, deleted_at
        SQL;

    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function findById(int $id): ?Source
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM sources WHERE id = ? AND is_deleted = 0',
            [$id],
        );

        return $row === null ? null : $this->mapRow($row);
    }

    /** @return list<Source> */
    public function findAll(int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM sources WHERE is_deleted = 0 ORDER BY id ASC LIMIT ? OFFSET ?',
            [$limit, $offset],
        );

        return array_map(fn (array $row): Source => $this->mapRow($row), $rows);
    }

    public function findAllSummaries(int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            <<<'SQL'
                SELECT
                    s.id, s.name, s.source_type, s.status, s.storage_path, s.original_filename,
                    s.mime_type, s.byte_size, s.error_message, s.ingestion_config_json,
                    s.created_at, s.updated_at, s.is_deleted, s.deleted_at,
                    (
                        SELECT COUNT(*)
                        FROM documents d
                        WHERE d.source_id = s.id AND d.is_deleted = 0
                    ) AS document_count,
                    (
                        SELECT COUNT(*)
                        FROM chunks c
                        WHERE c.source_id = s.id
                    ) AS chunk_count
                FROM sources s
                WHERE s.is_deleted = 0
                ORDER BY s.id DESC
                LIMIT ? OFFSET ?
                SQL,
            [$limit, $offset],
        );

        return array_map(
            fn (array $row): SourceSummary => new SourceSummary(
                source: $this->mapRow($row),
                documentCount: (int) $row['document_count'],
                chunkCount: (int) $row['chunk_count'],
            ),
            $rows,
        );
    }

    public function save(Source $source): int
    {
        $now = $this->now();

        $this->query->execute(
            <<<'SQL'
                INSERT INTO sources (
                    name, source_type, status, storage_path, original_filename, mime_type,
                    byte_size, error_message, ingestion_config_json, created_at, updated_at,
                    is_deleted, deleted_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
                SQL,
            [
                $source->name,
                $source->sourceType->value,
                $source->status->value,
                $source->storagePath,
                $source->originalFilename,
                $source->mimeType,
                $source->byteSize,
                $source->errorMessage,
                $source->ingestionConfigJson,
                $now,
                $now,
            ],
        );

        return $this->query->lastInsertId();
    }

    public function update(Source $source): void
    {
        if ($source->id === null) {
            throw new InvalidArgumentException('Source id is required for update.');
        }

        $this->query->execute(
            <<<'SQL'
                UPDATE sources SET
                    name = ?, source_type = ?, status = ?, storage_path = ?,
                    original_filename = ?, mime_type = ?, byte_size = ?, error_message = ?,
                    ingestion_config_json = ?, updated_at = ?
                WHERE id = ? AND is_deleted = 0
                SQL,
            [
                $source->name,
                $source->sourceType->value,
                $source->status->value,
                $source->storagePath,
                $source->originalFilename,
                $source->mimeType,
                $source->byteSize,
                $source->errorMessage,
                $source->ingestionConfigJson,
                $this->now(),
                $source->id,
            ],
        );
    }

    public function softDelete(int $id, string $deletedAt): void
    {
        $this->query->execute(
            'UPDATE sources SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ? AND is_deleted = 0',
            [$deletedAt, $this->now(), $id],
        );
    }

    public function countAll(): int
    {
        $rows = $this->query->fetchAll('SELECT COUNT(*) AS cnt FROM sources WHERE is_deleted = 0', []);

        return (int) ($rows[0]['cnt'] ?? 0);
    }

    /**
     * @param array<string, mixed> $row
     */
    private function mapRow(array $row): Source
    {
        return new Source(
            name: (string) $row['name'],
            sourceType: SourceType::from((string) $row['source_type']),
            status: SourceStatus::from((string) $row['status']),
            storagePath: (string) $row['storage_path'],
            originalFilename: isset($row['original_filename']) ? (string) $row['original_filename'] : null,
            mimeType: isset($row['mime_type']) ? (string) $row['mime_type'] : null,
            byteSize: isset($row['byte_size']) ? (int) $row['byte_size'] : null,
            errorMessage: isset($row['error_message']) ? (string) $row['error_message'] : null,
            ingestionConfigJson: isset($row['ingestion_config_json']) ? (string) $row['ingestion_config_json'] : null,
            id: (int) $row['id'],
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
            isDeleted: (bool) $row['is_deleted'],
            deletedAt: isset($row['deleted_at']) ? (string) $row['deleted_at'] : null,
        );
    }

    private function now(): string
    {
        return gmdate('Y-m-d H:i:s');
    }
}
