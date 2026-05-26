<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

final readonly class ListChatSessionsOutput
{
    /**
     * @param list<ChatSessionSummary> $sessions
     */
    public function __construct(
        public array $sessions,
        public int $total,
    ) {
    }
}
