<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

final readonly class TestLlmConnectionInput
{
    public function __construct(
        public ?string $apiKey,
        public string $model,
    ) {
    }
}
