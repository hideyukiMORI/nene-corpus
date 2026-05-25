<?php

declare(strict_types=1);

namespace NeneCorpus\Search;

interface SearchChunksUseCaseInterface
{
    /**
     * @return list<ChunkSearchResult>
     */
    public function execute(SearchChunksInput $input): array;
}
