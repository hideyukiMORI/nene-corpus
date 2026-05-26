<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

final readonly class GenerateChatReplyOutput
{
    /**
     * @param list<Citation> $citations
     */
    public function __construct(
        public string $content,
        public array $citations,
        public int $inputTokens = 0,
        public int $outputTokens = 0,
    ) {
    }
}
