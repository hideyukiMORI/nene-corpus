<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

final readonly class ListSourcesInput
{
    public function __construct(
        public int $limit,
        public int $offset,
    ) {
    }
}
