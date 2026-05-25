<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

use RuntimeException;

final readonly class StubAnthropicConnectionTester implements AnthropicConnectionTesterInterface
{
    public function test(string $apiKey, string $model, int $maxTokens = 1): void
    {
        if ($apiKey === '') {
            throw new RuntimeException('API key is required.');
        }

        if ($model === '') {
            throw new RuntimeException('Model is required.');
        }
    }
}
