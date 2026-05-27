<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

final readonly class GetTopQuestionsUseCase implements GetTopQuestionsUseCaseInterface
{
    public function __construct(
        private AnalyticsRepositoryInterface $repo,
    ) {
    }

    public function execute(GetTopQuestionsInput $input): GetTopQuestionsOutput
    {
        $rows = $this->repo->topQuestions($input->limit, $input->from, $input->to);

        $questions = array_map(
            static fn (array $row): TopQuestion => new TopQuestion(
                content:    $row['content'],
                count:      $row['count'],
                lastAskedAt: $row['last_asked_at'],
            ),
            $rows,
        );

        return new GetTopQuestionsOutput($questions);
    }
}
