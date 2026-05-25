<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

final readonly class ClaudeToolUseBlock
{
    /**
     * @param array<string, mixed> $input
     */
    public function __construct(
        public string $id,
        public string $name,
        public array $input,
    ) {
    }
}
