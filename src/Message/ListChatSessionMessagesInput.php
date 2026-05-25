<?php

declare(strict_types=1);

namespace NeneCorpus\Message;

final readonly class ListChatSessionMessagesInput
{
    public function __construct(
        public int $sessionId,
        public int $limit,
        public int $offset,
    ) {
    }
}
