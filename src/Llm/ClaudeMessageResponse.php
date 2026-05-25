<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

final readonly class ClaudeMessageResponse
{
    /**
     * @param list<array<string, mixed>> $contentBlocks
     */
    public function __construct(
        public string $stopReason,
        public array $contentBlocks,
    ) {
    }

    public function text(): ?string
    {
        $parts = [];

        foreach ($this->contentBlocks as $block) {
            if (($block['type'] ?? '') === 'text' && is_string($block['text'] ?? null)) {
                $parts[] = $block['text'];
            }
        }

        if ($parts === []) {
            return null;
        }

        return implode("\n", $parts);
    }

    /**
     * @return list<ClaudeToolUseBlock>
     */
    public function toolUses(): array
    {
        $uses = [];

        foreach ($this->contentBlocks as $block) {
            if (($block['type'] ?? '') !== 'tool_use') {
                continue;
            }

            if (!is_string($block['id'] ?? null) || !is_string($block['name'] ?? null)) {
                continue;
            }

            $input = $block['input'] ?? [];
            if (!is_array($input)) {
                $input = [];
            }

            $uses[] = new ClaudeToolUseBlock(
                id: $block['id'],
                name: $block['name'],
                input: $input,
            );
        }

        return $uses;
    }
}
