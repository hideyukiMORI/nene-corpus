<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

interface ListChatSessionsUseCaseInterface
{
    /** @return list<ChatSessionSummary> */
    public function execute(ListChatSessionsInput $input): array;
}
