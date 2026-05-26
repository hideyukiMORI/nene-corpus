<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

final readonly class ListSourcesOutput
{
    /**
     * @param list<SourceSummary> $sources
     */
    public function __construct(
        public array $sources,
        public int $total,
    ) {
    }
}
