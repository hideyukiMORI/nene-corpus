<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

use NeneCorpus\Config\EnvironmentVariableUpdater;
use NeneCorpus\Install\EnvFileWriter;
use NeneCorpus\Install\InstallRuntimeException;
use NeneCorpus\Llm\AnthropicApiKeyMask;
use NeneCorpus\Llm\AnthropicConfig;
use NeneCorpus\Llm\AnthropicConnectionTesterInterface;

final readonly class UpdateLlmSettingsUseCase implements UpdateLlmSettingsUseCaseInterface
{
    public function __construct(
        private EnvFileWriter $envFileWriter,
        private EnvironmentVariableUpdater $environmentUpdater,
        private AnthropicConnectionTesterInterface $connectionTester,
    ) {
    }

    public function execute(UpdateLlmSettingsInput $input): LlmSettingsView
    {
        $current = AnthropicConfig::fromEnvironment();
        $apiKey = $current->apiKey ?? '';

        if ($input->apiKeyProvided && $input->apiKey !== null) {
            $apiKey = $input->apiKey;
        }

        if ($apiKey === '') {
            throw new InstallRuntimeException('API key is required.');
        }

        $this->connectionTester->test($apiKey, $input->model);

        try {
            $this->envFileWriter->write([
                'ANTHROPIC_API_KEY' => $apiKey,
                'ANTHROPIC_MODEL' => $input->model,
                'ANTHROPIC_MAX_TOKENS' => (string) $input->maxTokens,
            ]);
        } catch (InstallRuntimeException $exception) {
            throw new InstallRuntimeException('Unable to update LLM settings: ' . $exception->getMessage(), 0, $exception);
        }

        $this->environmentUpdater->apply([
            'ANTHROPIC_API_KEY' => $apiKey,
            'ANTHROPIC_MODEL' => $input->model,
            'ANTHROPIC_MAX_TOKENS' => (string) $input->maxTokens,
        ]);

        return new LlmSettingsView(
            configured: true,
            apiKeyMasked: AnthropicApiKeyMask::mask($apiKey),
            model: $input->model,
            maxTokens: $input->maxTokens,
        );
    }

}
