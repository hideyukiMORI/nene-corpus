<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

final readonly class GetTopQuestionsOutput
{
    /**
     * @param list<TopQuestion> $questions
     */
    public function __construct(
        public array $questions,
    ) {
    }
}
