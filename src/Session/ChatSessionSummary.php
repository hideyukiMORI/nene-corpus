<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

final readonly class ChatSessionSummary
{
    public function __construct(
        public ChatSession $session,
        public int $messageCount,
        public ?string $lastMessageAt,
    ) {
    }
}
