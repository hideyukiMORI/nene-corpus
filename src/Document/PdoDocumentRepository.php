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
}
