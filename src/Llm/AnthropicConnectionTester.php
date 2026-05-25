<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

use RuntimeException;

final readonly class AnthropicConnectionTester implements AnthropicConnectionTesterInterface
{
    private const API_URL = 'https://api.anthropic.com/v1/messages';

    private const API_VERSION = '2023-06-01';

    public function test(string $apiKey, string $model, int $maxTokens = 1): void
    {
        if ($apiKey === '') {
            throw new RuntimeException('API key is required.');
        }

        $payload = json_encode([
            'model' => $model,
            'max_tokens' => max(1, min($maxTokens, 16)),
            'messages' => [
                ['role' => 'user', 'content' => 'ping'],
            ],
        ], JSON_THROW_ON_ERROR);

        $handle = curl_init(self::API_URL);
        if ($handle === false) {
            throw new RuntimeException('Failed to initialize Anthropic HTTP client.');
        }

        curl_setopt_array($handle, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-api-key: ' . $apiKey,
                'anthropic-version: ' . self::API_VERSION,
            ],
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_TIMEOUT => 30,
        ]);

        $responseBody = curl_exec($handle);
        $statusCode = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $curlError = curl_error($handle);
        curl_close($handle);

        if (!is_string($responseBody)) {
            throw new RuntimeException('Anthropic API request failed: ' . $curlError);
        }

        if ($statusCode === 401 || $statusCode === 403) {
            throw new RuntimeException('Anthropic API rejected the API key (HTTP ' . $statusCode . ').');
        }

        if ($statusCode < 200 || $statusCode >= 300) {
            throw new RuntimeException('Anthropic API returned HTTP ' . $statusCode . '.');
        }
    }
}
