<?php

declare(strict_types=1);

namespace NeneCorpus\Chunk;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\ClockInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

final readonly class PdoChunkRepository implements ChunkRepositoryInterface
{
    private const SELECT_COLUMNS = <<<'SQL'
        id, document_id, source_id, chunk_index, content, page_number, section_label,
        token_count, created_at, updated_at
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

    public function findById(int $id): ?Chunk
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM chunks WHERE id = ? AND organization_id = ?',
            [$id, $this->orgId()],
        );

        return $row === null ? null : $this->mapRow($row);
    }

    /** @return list<Chunk> */
    public function findByDocumentId(int $documentId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM chunks WHERE document_id = ? AND organization_id = ? ORDER BY chunk_index ASC, id ASC',
            [$documentId, $this->orgId()],
        );

        return array_map(fn (array $row): Chunk => $this->mapRow($row), $rows);
    }

    public function save(Chunk $chunk): int
    {
        $now = $this->now();

        $this->query->execute(
            <<<'SQL'
                INSERT INTO chunks (
                    organization_id, document_id, source_id, chunk_index, content, page_number,
                    section_label, token_count, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                SQL,
            [
                $this->orgId(),
                $chunk->documentId,
                $chunk->sourceId,
                $chunk->chunkIndex,
                $chunk->content,
                $chunk->pageNumber,
                $chunk->sectionLabel,
                $chunk->tokenCount,
                $now,
                $now,
            ],
        );

        return $this->query->lastInsertId();
    }

    public function deleteByDocumentId(int $documentId): void
    {
        $this->query->execute('DELETE FROM chunks WHERE document_id = ? AND organization_id = ?', [$documentId, $this->orgId()]);
    }

    public function deleteBySourceId(int $sourceId): void
    {
        $this->query->execute('DELETE FROM chunks WHERE source_id = ? AND organization_id = ?', [$sourceId, $this->orgId()]);
    }

    /**
     * @param array<string, mixed> $row
     */
    private function mapRow(array $row): Chunk
    {
        return new Chunk(
            documentId: (int) $row['document_id'],
            sourceId: (int) $row['source_id'],
            content: (string) $row['content'],
            chunkIndex: (int) $row['chunk_index'],
            pageNumber: isset($row['page_number']) ? (int) $row['page_number'] : null,
            sectionLabel: isset($row['section_label']) ? (string) $row['section_label'] : null,
            tokenCount: isset($row['token_count']) ? (int) $row['token_count'] : null,
            id: (int) $row['id'],
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
        );
    }

    private function now(): string
    {
        return $this->clock->now()->format('Y-m-d H:i:s');
    }
}
