<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

final readonly class GetTopQuestionsInput
{
    public function __construct(
        public int $limit = 20,
        public ?string $from = null,
        public ?string $to = null,
    ) {
    }
}
