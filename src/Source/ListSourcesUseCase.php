<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

final readonly class ListSourcesUseCase implements ListSourcesUseCaseInterface
{
    private const MAX_LIMIT = 100;

    public function __construct(
        private SourceRepositoryInterface $sources,
    ) {
    }

    public function execute(ListSourcesInput $input): array
    {
        $limit = max(1, min(self::MAX_LIMIT, $input->limit));
        $offset = max(0, $input->offset);

        return $this->sources->findAllSummaries($limit, $offset);
    }
}
