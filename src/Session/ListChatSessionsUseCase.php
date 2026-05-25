<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

final readonly class ListChatSessionsUseCase implements ListChatSessionsUseCaseInterface
{
    private const MAX_LIMIT = 100;

    public function __construct(
        private ChatSessionRepositoryInterface $sessions,
    ) {
    }

    public function execute(ListChatSessionsInput $input): array
    {
        $limit = max(1, min(self::MAX_LIMIT, $input->limit));
        $offset = max(0, $input->offset);

        return $this->sessions->findAllSummaries($limit, $offset);
    }
}
