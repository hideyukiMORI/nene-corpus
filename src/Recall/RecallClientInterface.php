<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

/**
 * Upstream client for NeNe Recall (ADR 0007 Decision 1).
 *
 * `$orgId` is passed explicitly on every call because Recall enforces tenant
 * isolation on its own side too (Recall ADR 0003) — there is no server-side
 * default, and there must not be one here either.
 */
interface RecallClientInterface
{
    /**
     * @return list<RecallSearchHit> Recall's own ranking, best first
     *
     * @throws RecallUnavailableException
     */
    public function search(int $orgId, string $query, int $limit): array;

    /**
     * @param list<RecallChunkInput> $chunks
     *
     * @throws RecallUnavailableException
     */
    public function putChunks(int $orgId, array $chunks): void;

    /**
     * @throws RecallUnavailableException
     */
    public function deleteByDocument(int $orgId, int $documentId): void;

    /**
     * @throws RecallUnavailableException
     */
    public function deleteBySource(int $orgId, int $sourceId): void;
}
