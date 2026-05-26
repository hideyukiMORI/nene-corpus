<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

use RuntimeException;

final readonly class HttpClaudeMessagesClient implements ClaudeMessagesClientInterface
{
    private const API_URL = 'https://api.anthropic.com/v1/messages';

    private const API_VERSION = '2023-06-01';

    public function __construct(
        private AnthropicConfig $config,
    ) {
    }

    public function createMessage(string $system, array $messages, array $tools): ClaudeMessageResponse
    {
        if (!$this->config->isConfigured()) {
            throw new LlmNotConfiguredException();
        }

        $payload = [
            'model' => $this->config->model,
            'max_tokens' => $this->config->maxTokens,
            'system' => $system,
            'messages' => $messages,
        ];

        if ($tools !== []) {
            $payload['tools'] = $tools;
        }

        $body = json_encode($payload, JSON_THROW_ON_ERROR);

        $handle = curl_init(self::API_URL);
        if ($handle === false) {
            throw new RuntimeException('Failed to initialize Anthropic HTTP client.');
        }

        curl_setopt_array($handle, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-api-key: ' . $this->config->apiKey,
                'anthropic-version: ' . self::API_VERSION,
            ],
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => 120,
        ]);

        $responseBody = curl_exec($handle);
        $statusCode = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $curlError = curl_error($handle);
        curl_close($handle);

        if (!is_string($responseBody)) {
            throw new RuntimeException('Anthropic API request failed: ' . $curlError);
        }

        if ($statusCode < 200 || $statusCode >= 300) {
            throw new RuntimeException('Anthropic API returned HTTP ' . $statusCode . '.');
        }

        /** @var array<string, mixed> $decoded */
        $decoded = json_decode($responseBody, true, 512, JSON_THROW_ON_ERROR);

        $stopReason = is_string($decoded['stop_reason'] ?? null) ? $decoded['stop_reason'] : 'end_turn';
        $content = $decoded['content'] ?? [];
        if (!is_array($content)) {
            $content = [];
        }

        /** @var list<array<string, mixed>> $contentBlocks */
        $contentBlocks = array_values(array_filter($content, is_array(...)));

        $usage = $decoded['usage'] ?? [];
        $inputTokens = is_array($usage) && is_int($usage['input_tokens'] ?? null) ? (int) $usage['input_tokens'] : 0;
        $outputTokens = is_array($usage) && is_int($usage['output_tokens'] ?? null) ? (int) $usage['output_tokens'] : 0;

        return new ClaudeMessageResponse(
            stopReason: $stopReason,
            contentBlocks: $contentBlocks,
            inputTokens: $inputTokens,
            outputTokens: $outputTokens,
        );
    }
}
