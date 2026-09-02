<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

use NeneCorpus\Chunk\Chunk;

/**
 * The read side of `recall:reindex`, scoped to the current organization.
 *
 * Kept separate from {@see \NeneCorpus\Chunk\ChunkRepositoryInterface} because a
 * full-corpus, keyset-paged scan is a maintenance concern; adding it to the chunk
 * repository would put it behind the indexing decorator as well.
 */
interface RecallReindexReaderInterface
{
    /**
     * Sources that still exist (not soft-deleted) in this organization.
     *
     * @return list<int>
     */
    public function listAliveSourceIds(): array;

    /**
     * Chunks belonging to live sources and documents, ordered by id.
     *
     * Keyset pagination (`id > $afterId`) rather than OFFSET: the scan stays
     * correct on large corpora and does not slow down as it advances.
     *
     * @return list<Chunk>
     */
    public function listAliveChunks(int $afterId, int $limit): array;
}
