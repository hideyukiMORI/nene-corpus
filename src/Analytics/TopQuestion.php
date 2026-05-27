<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

final readonly class TopQuestion
{
    public function __construct(
        public string $content,
        public int $count,
        public string $lastAskedAt,
    ) {
    }
}
