<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

use NeneCorpus\Llm\Citation;

final readonly class SendChatMessageOutput
{
    /**
     * @param list<Citation> $citations
     */
    public function __construct(
        public int $messageId,
        public int $sessionId,
        public string $role,
        public string $content,
        public array $citations,
    ) {
    }
}
