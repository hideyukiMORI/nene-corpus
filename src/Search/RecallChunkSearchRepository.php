<?php

declare(strict_types=1);

namespace NeneCorpus\Search;

use LogicException;
use NeneCorpus\Recall\RecallClientInterface;
use NeneCorpus\Recall\RecallUnavailableException;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use Psr\Log\LoggerInterface;

/**
 * Hybrid search through NeNe Recall, with the LIKE search kept as a fallback.
 *
 * This repository holds no SQL. It composes the upstream client (the Recall
 * layer) with {@see PdoChunkSearchGuard} (the PDO layer), so the layer rule
 * "repositories do not speak HTTP" still holds — the HTTP lives upstream, as it
 * does for NeNe Records. ADR 0007 Decision 2 is the record of that reading.
 */
final readonly class RecallChunkSearchRepository implements ChunkSearchRepositoryInterface
{
    public function __construct(
        private RecallClientInterface $recall,
        private PdoChunkSearchGuard $guard,
        private ChunkSearchRepositoryInterface $fallback,
        private RequestScopedOrgIdHolder $orgIdHolder,
        private LoggerInterface $logger,
        private bool $strict = false,
    ) {
    }

    public function search(string $query, int $limit): array
    {
        try {
            $hits = $this->recall->search($this->orgId(), $query, $limit);
        } catch (RecallUnavailableException $exception) {
            if ($this->strict) {
                throw $exception;
            }

            // Returning nothing would let the chat answer with no evidence at all,
            // which reads as "the corpus has nothing on this". Degrading to LIKE
            // search is the honest failure — but it must never be silent.
            $this->logger->warning(
                'NeNe Recall search failed; falling back to LIKE search.',
                ['reason' => $exception->getMessage()],
            );

            return $this->fallback->search($query, $limit);
        }

        $ranked = [];

        foreach ($hits as $hit) {
            // No external_id means the chunk was indexed by something other than
            // this Corpus (Recall can be used standalone). We cannot cite it,
            // because the text of record lives in our database.
            if ($hit->externalId === null) {
                continue;
            }

            $ranked[$hit->externalId] = $hit->score;
        }

        if ($ranked === []) {
            return [];
        }

        $alive = $this->guard->filterAlive(array_keys($ranked));

        $results = [];

        foreach ($ranked as $chunkId => $score) {
            if (!isset($alive[$chunkId])) {
                continue;
            }

            $results[] = new ChunkSearchResult(chunk: $alive[$chunkId], score: $score);
        }

        return $results;
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
