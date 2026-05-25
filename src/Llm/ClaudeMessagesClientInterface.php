<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

interface ClaudeMessagesClientInterface
{
    /**
     * @param list<array<string, mixed>> $messages
     * @param list<array<string, mixed>> $tools
     */
    public function createMessage(string $system, array $messages, array $tools): ClaudeMessageResponse;
}
