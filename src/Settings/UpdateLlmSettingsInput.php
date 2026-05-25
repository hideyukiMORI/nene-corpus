<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

final readonly class UpdateLlmSettingsInput
{
    public function __construct(
        public bool $apiKeyProvided,
        public ?string $apiKey,
        public string $model,
        public int $maxTokens,
    ) {
    }
}
