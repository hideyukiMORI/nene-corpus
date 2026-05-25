<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

final readonly class LlmSettingsView
{
    public function __construct(
        public bool $configured,
        public ?string $apiKeyMasked,
        public string $model,
        public int $maxTokens,
    ) {
    }

    /**
     * @return array{
     *     configured: bool,
     *     api_key_masked: string|null,
     *     model: string,
     *     max_tokens: int
     * }
     */
    public function toArray(): array
    {
        return [
            'configured' => $this->configured,
            'api_key_masked' => $this->apiKeyMasked,
            'model' => $this->model,
            'max_tokens' => $this->maxTokens,
        ];
    }
}
