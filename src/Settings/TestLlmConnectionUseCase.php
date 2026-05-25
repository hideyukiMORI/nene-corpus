<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

use NeneCorpus\Llm\AnthropicConfig;
use NeneCorpus\Llm\AnthropicConnectionTesterInterface;
use RuntimeException;

final readonly class TestLlmConnectionUseCase implements TestLlmConnectionUseCaseInterface
{
    public function __construct(
        private LlmSettingsValidator $validator,
        private AnthropicConnectionTesterInterface $connectionTester,
    ) {
    }

    /**
     * @param array<string, mixed> $body
     */
    public function executeFromBody(array $body): void
    {
        $input = $this->validator->validateTest($body);
        $apiKey = $input->apiKey ?? AnthropicConfig::fromEnvironment()->apiKey ?? '';

        if ($apiKey === '') {
            throw new RuntimeException('API key is required.');
        }

        $this->connectionTester->test($apiKey, $input->model);
    }
}
