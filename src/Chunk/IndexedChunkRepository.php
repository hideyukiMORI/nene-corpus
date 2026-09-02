<?php

declare(strict_types=1);

namespace NeneCorpus\Chunk;

use LogicException;
use NeneCorpus\Recall\RecallChunkInput;
use NeneCorpus\Recall\RecallClientInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

/**
 * Keeps NeNe Recall in step with the chunks table (ADR 0007 Decision 3).
 *
 * A decorator rather than a change to {@see PdoChunkRepository}: the PDO
 * repository stays SQL-only, and a deployment without Recall configured runs the
 * undecorated one, so its behaviour is untouched.
 *
 * 🔴 Failures are **not** swallowed. Ingestion is an administrative action a
 * person is watching; a chunk that is saved but never indexed produces a corpus
 * that answers as if the document were never uploaded, and nothing would ever
 * point at the cause. Recovery is `recall:reindex`, not a silent retry.
 *
 * The write order is database first, Recall second — the database is the record.
 * What a failure leaves behind depends on the ingestion path, and only one of
 * them is transactional:
 *
 * - **PDF** ({@see \NeneCorpus\Ingestion\CreatePdfSourceUseCase}) runs inside
 *   `DatabaseTransactionManagerInterface::transactional()`, so a Recall failure
 *   rolls the chunk rows back and both sides stay consistent.
 * - **text and CSV** ({@see \NeneCorpus\Ingestion\CreateTextSourceUseCase},
 *   {@see \NeneCorpus\Ingestion\CreateCsvSourceUseCase}) have no transaction.
 *   They mark the source `failed` and rethrow, but chunk rows already committed
 *   stay in Corpus with no counterpart in Recall — including the row of the very
 *   save that failed, because the database write precedes the Recall call.
 *
 * That drift is expected, not a hole: it is exactly what `recall:reindex`
 * exists to collect (ADR 0007 Decision 4). Do not paper over it by catching the
 * exception here — a half-indexed source that reports success is worse than one
 * that reports failure.
 */
final readonly class IndexedChunkRepository implements ChunkRepositoryInterface
{
    public function __construct(
        private ChunkRepositoryInterface $inner,
        private RecallClientInterface $recall,
        private RequestScopedOrgIdHolder $orgIdHolder,
    ) {
    }

    public function findById(int $id): ?Chunk
    {
        return $this->inner->findById($id);
    }

    /** @return list<Chunk> */
    public function findByDocumentId(int $documentId): array
    {
        return $this->inner->findByDocumentId($documentId);
    }

    public function save(Chunk $chunk): int
    {
        $id = $this->inner->save($chunk);

        $this->recall->putChunks($this->orgId(), [RecallChunkInput::fromChunk($id, $chunk)]);

        return $id;
    }

    public function deleteByDocumentId(int $documentId): void
    {
        $this->inner->deleteByDocumentId($documentId);
        $this->recall->deleteByDocument($this->orgId(), $documentId);
    }

    public function deleteBySourceId(int $sourceId): void
    {
        $this->inner->deleteBySourceId($sourceId);
        $this->recall->deleteBySource($this->orgId(), $sourceId);
    }

    private function orgId(): int
    {
        $id = $this->orgIdHolder->getId();

        if ($id === null) {
            throw new LogicException('Organization ID is not resolved. Check OrgResolverMiddleware setup.');
        }

        return $id;
    }
}
