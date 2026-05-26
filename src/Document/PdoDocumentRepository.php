<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoDocumentRepository implements DocumentRepositoryInterface
{
    private const SELECT_COLUMNS = <<<'SQL'
        id, source_id, title, position, metadata_json, created_at, updated_at, is_deleted, deleted_at
        SQL;

    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function findById(int $id): ?Document
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM documents WHERE id = ? AND is_deleted = 0',
            [$id],
        );

        return $row === null ? null : $this->mapRow($row);
    }

    /** @return list<Document> */
    public function findBySourceId(int $sourceId, int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM documents WHERE source_id = ? AND is_deleted = 0 ORDER BY position ASC, id ASC LIMIT ? OFFSET ?',
            [$sourceId, $limit, $offset],
        );

        return array_map(fn (array $row): Document => $this->mapRow($row), $rows);
    }

    /** @return list<DocumentSummary> */
    public function findSummariesBySourceId(int $sourceId, int $limit, int $offset, string $query = ''): array
    {
        [$whereExtra, $params] = $this->buildQueryCondition($sourceId, $query);

        $rows = $this->query->fetchAll(
            <<<SQL
                SELECT
                    d.id, d.source_id, d.title, d.position, d.metadata_json,
                    d.created_at, d.updated_at, d.is_deleted, d.deleted_at,
                    (
                        SELECT COUNT(*)
                        FROM chunks c
                        WHERE c.document_id = d.id
                    ) AS chunk_count,
                    (
                        SELECT c.content
                        FROM chunks c
                        WHERE c.document_id = d.id
                        ORDER BY c.chunk_index ASC, c.id ASC
                        LIMIT 1
                    ) AS first_chunk_content
                FROM documents d
                WHERE d.source_id = ? AND d.is_deleted = 0{$whereExtra}
                ORDER BY d.position ASC, d.id ASC
                LIMIT ? OFFSET ?
                SQL,
            [...$params, $limit, $offset],
        );

        return array_map(function (array $row): DocumentSummary {
            $previewSource = isset($row['first_chunk_content']) ? (string) $row['first_chunk_content'] : '';
            $preview = $previewSource;

            if (mb_strlen($preview) > 120) {
                $preview = mb_substr($preview, 0, 120) . '…';
            }

            return new DocumentSummary(
                document: $this->mapRow($row),
                chunkCount: (int) $row['chunk_count'],
                contentPreview: $preview,
            );
        }, $rows);
    }

    public function countBySourceId(int $sourceId, string $query = ''): int
    {
        [$whereExtra, $params] = $this->buildQueryCondition($sourceId, $query);

        $row = $this->query->fetchOne(
            "SELECT COUNT(*) AS cnt FROM documents d WHERE d.source_id = ? AND d.is_deleted = 0{$whereExtra}",
            $params,
        );

        return $row === null ? 0 : (int) $row['cnt'];
    }

    public function save(Document $document): int
    {
        $now = $this->now();

        $this->query->execute(
            <<<'SQL'
                INSERT INTO documents (
                    source_id, title, position, metadata_json, created_at, updated_at, is_deleted, deleted_at
                ) VALUES (?, ?, ?, ?, ?, ?, 0, NULL)
                SQL,
            [
                $document->sourceId,
                $document->title,
                $document->position,
                $document->metadataJson,
                $now,
                $now,
            ],
        );

        return $this->query->lastInsertId();
    }

    public function update(Document $document): void
    {
        if ($document->id === null) {
            throw new \InvalidArgumentException('Document id is required for update.');
        }

        $this->query->execute(
            'UPDATE documents SET title = ?, position = ?, metadata_json = ?, updated_at = ? WHERE id = ? AND is_deleted = 0',
            [
                $document->title,
                $document->position,
                $document->metadataJson,
                $this->now(),
                $document->id,
            ],
        );
    }

    public function softDelete(int $id, string $deletedAt): void
    {
        $this->query->execute(
            'UPDATE documents SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ? AND is_deleted = 0',
            [$deletedAt, $this->now(), $id],
        );
    }

    /**
     * @param array<string, mixed> $row
     */
    private function mapRow(array $row): Document
    {
        return new Document(
            sourceId: (int) $row['source_id'],
            title: (string) $row['title'],
            position: (int) $row['position'],
            metadataJson: isset($row['metadata_json']) ? (string) $row['metadata_json'] : null,
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

    /**
     * Returns [whereExtra, params] for optional title LIKE filter.
     * $params already contains $sourceId as the first element.
     *
     * @return array{string, list<mixed>}
     */
    private function buildQueryCondition(int $sourceId, string $query): array
    {
        $params = [$sourceId];
        $whereExtra = '';

        $q = trim($query);

        if ($q !== '') {
            $whereExtra = ' AND d.title LIKE ? ESCAPE \'!\'';
            $params[] = '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $q) . '%';
        }

        return [$whereExtra, $params];
    }
}
