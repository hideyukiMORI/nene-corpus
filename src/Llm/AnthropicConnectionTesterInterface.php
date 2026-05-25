<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

interface AnthropicConnectionTesterInterface
{
    public function test(string $apiKey, string $model, int $maxTokens = 1): void;
}
