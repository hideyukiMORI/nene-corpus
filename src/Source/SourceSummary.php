<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

final readonly class SourceSummary
{
    public function __construct(
        public Source $source,
        public int $documentCount,
        public int $chunkCount,
    ) {
    }
}
