<?php

declare(strict_types=1);

namespace NeneCorpus\Search;

final readonly class SearchChunksUseCase implements SearchChunksUseCaseInterface
{
    private const MAX_LIMIT = 50;

    public function __construct(
        private ChunkSearchRepositoryInterface $search,
    ) {
    }

    public function execute(SearchChunksInput $input): array
    {
        $query = trim($input->query);

        if ($query === '') {
            return [];
        }

        $limit = max(1, min(self::MAX_LIMIT, $input->limit));

        return $this->search->search($query, $limit);
    }
}
