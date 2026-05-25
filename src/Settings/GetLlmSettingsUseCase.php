<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

use NeneCorpus\Llm\AnthropicApiKeyMask;
use NeneCorpus\Llm\AnthropicConfig;

final readonly class GetLlmSettingsUseCase implements GetLlmSettingsUseCaseInterface
{
    public function execute(): LlmSettingsView
    {
        $config = AnthropicConfig::fromEnvironment();

        return new LlmSettingsView(
            configured: $config->isConfigured(),
            apiKeyMasked: AnthropicApiKeyMask::mask($config->apiKey),
            model: $config->model,
            maxTokens: $config->maxTokens,
        );
    }
}
