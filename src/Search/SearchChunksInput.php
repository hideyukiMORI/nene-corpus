<?php

declare(strict_types=1);

namespace NeneCorpus\Search;

final readonly class SearchChunksInput
{
    public function __construct(
        public string $query,
        public int $limit = 10,
    ) {
    }
}
