<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

final class StubClaudeMessagesClient implements ClaudeMessagesClientInterface
{
    private int $callCount = 0;

    public function createMessage(string $system, array $messages, array $tools): ClaudeMessageResponse
    {
        ++$this->callCount;

        if ($tools !== [] && $this->callCount % 2 === 1) {
            $query = $this->extractLastUserMessage($messages);

            return new ClaudeMessageResponse(
                stopReason: 'tool_use',
                contentBlocks: [[
                    'type' => 'tool_use',
                    'id' => 'toolu_stub_search',
                    'name' => CorpusSearchToolDefinition::NAME,
                    'input' => ['query' => $query],
                ]],
            );
        }

        return new ClaudeMessageResponse(
            stopReason: 'end_turn',
            contentBlocks: [[
                'type' => 'text',
                'text' => 'Here is an answer grounded in the corpus search results.',
            ]],
        );
    }

    /**
     * @param list<array<string, mixed>> $messages
     */
    private function extractLastUserMessage(array $messages): string
    {
        for ($index = count($messages) - 1; $index >= 0; --$index) {
            $message = $messages[$index];
            if (($message['role'] ?? '') !== 'user') {
                continue;
            }

            $content = $message['content'] ?? '';
            if (is_string($content)) {
                return $content;
            }
        }

        return '';
    }
}
