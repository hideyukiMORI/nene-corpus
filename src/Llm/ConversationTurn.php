<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

final readonly class ConversationTurn
{
    public function __construct(
        public string $role,
        public string $content,
    ) {
    }
}
