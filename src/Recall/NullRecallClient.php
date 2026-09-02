<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

/**
 * Used when NENE_RECALL_BASE_URL is empty, so that nothing has to be nullable.
 *
 * It is never reached in practice: the service providers only wire the Recall
 * search repository and the indexing decorator when the config is present. It
 * exists so `RecallClientInterface` can always be resolved from the container
 * (same pattern as {@see \NeneCorpus\Upstream\NullNeneRecordsClient}).
 */
final readonly class NullRecallClient implements RecallClientInterface
{
    public function search(int $orgId, string $query, int $limit): array
    {
        return [];
    }

    public function putChunks(int $orgId, array $chunks): void
    {
    }

    public function deleteByDocument(int $orgId, int $documentId): void
    {
    }

    public function deleteBySource(int $orgId, int $sourceId): void
    {
    }
}
