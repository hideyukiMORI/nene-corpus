<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

final readonly class GenerateChatReplyInput
{
    /**
     * @param list<ConversationTurn> $history
     */
    public function __construct(
        public string $userMessage,
        public array $history = [],
    ) {
    }
}
