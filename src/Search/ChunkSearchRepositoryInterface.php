<?php

declare(strict_types=1);

namespace NeneCorpus\Search;

interface ChunkSearchRepositoryInterface
{
    /**
     * @return list<ChunkSearchResult>
     */
    public function search(string $query, int $limit): array;
}
