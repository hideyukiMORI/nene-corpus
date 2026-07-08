<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\ClockInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

final readonly class PdoDocumentRepository implements DocumentRepositoryInterface
{
    private const SELECT_COLUMNS = <<<'SQL'
        id, source_id, title, position, metadata_json, created_at, updated_at, is_deleted, deleted_at
        SQL;

    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedOrgIdHolder $orgIdHolder,
        private ClockInterface $clock,
    ) {
    }

    private function orgId(): int
    {
        $id = $this->orgIdHolder->getId();

        if ($id === null) {
            throw new LogicException('Organization ID is not resolved. Check OrgResolverMiddleware setup.');
        }

        return $id;
    }

    public function findById(int $id): ?Document
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM documents WHERE id = ? AND organization_id = ? AND is_deleted = 0',
            [$id, $this->orgId()],
        );

        return $row === null ? null : $this->mapRow($row);
    }

    /** @return list<Document> */
    public function findBySourceId(int $sourceId, int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM documents WHERE source_id = ? AND organization_id = ? AND is_deleted = 0 ORDER BY position ASC, id ASC LIMIT ? OFFSET ?',
            [$sourceId, $this->orgId(), $limit, $offset],
        );

        return array_map(fn (array $row): Document => $this->mapRow($row), $rows);
    }

    /** @return list<DocumentSummary> */
    public function findSummariesBySourceId(int $sourceId, int $limit, int $offset, string $query = ''): array
    {
        [$whereExtra, $extraParams] = $this->buildQueryCondition($query);

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
                WHERE d.source_id = ? AND d.organization_id = ? AND d.is_deleted = 0{$whereExtra}
                ORDER BY d.position ASC, d.id ASC
                LIMIT ? OFFSET ?
                SQL,
            [$sourceId, $this->orgId(), ...$extraParams, $limit, $offset],
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
        [$whereExtra, $extraParams] = $this->buildQueryCondition($query);

        $row = $this->query->fetchOne(
            "SELECT COUNT(*) AS cnt FROM documents d WHERE d.source_id = ? AND d.organization_id = ? AND d.is_deleted = 0{$whereExtra}",
            [$sourceId, $this->orgId(), ...$extraParams],
        );

        return $row === null ? 0 : (int) $row['cnt'];
    }

    public function save(Document $document): int
    {
        $now = $this->now();

        $this->query->execute(
            <<<'SQL'
                INSERT INTO documents (
                    organization_id, source_id, title, position, metadata_json, created_at, updated_at, is_deleted, deleted_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL)
                SQL,
            [
                $this->orgId(),
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
            'UPDATE documents SET title = ?, position = ?, metadata_json = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND is_deleted = 0',
            [
                $document->title,
                $document->position,
                $document->metadataJson,
                $this->now(),
                $document->id,
                $this->orgId(),
            ],
        );
    }

    public function softDelete(int $id, string $deletedAt): void
    {
        $this->query->execute(
            'UPDATE documents SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND is_deleted = 0',
            [$deletedAt, $this->now(), $id, $this->orgId()],
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
        return $this->clock->now()->format('Y-m-d H:i:s');
    }

    /**
     * Returns [whereExtra, extraParams] for optional title LIKE filter.
     * Caller is responsible for prepending source_id and organization_id before these params.
     *
     * @return array{string, list<mixed>}
     */
    private function buildQueryCondition(string $query): array
    {
        $extraParams = [];
        $whereExtra = '';

        $q = trim($query);

        if ($q !== '') {
            $whereExtra = ' AND d.title LIKE ? ESCAPE \'!\'';
            $extraParams[] = '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $q) . '%';
        }

        return [$whereExtra, $extraParams];
    }
}
