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

    public function execute(ListChatSessionsInput $input): ListChatSessionsOutput
    {
        $limit = max(1, min(self::MAX_LIMIT, $input->limit));
        $offset = max(0, $input->offset);

        return new ListChatSessionsOutput(
            sessions: $this->sessions->findAllSummaries($limit, $offset),
            total: $this->sessions->countAll(),
        );
    }
}
