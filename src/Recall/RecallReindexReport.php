<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

final readonly class RecallReindexReport
{
    public function __construct(
        public int $organizationId,
        public int $clearedSources,
        public int $indexedChunks,
    ) {
    }
}
