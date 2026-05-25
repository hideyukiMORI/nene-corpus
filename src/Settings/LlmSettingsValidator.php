<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;

final readonly class LlmSettingsValidator
{
    private const DEFAULT_MODEL = 'claude-3-5-haiku-20241022';

    /**
     * @param array<string, mixed> $body
     */
    public function validateUpdate(array $body): UpdateLlmSettingsInput
    {
        $errors = [];

        $apiKeyProvided = array_key_exists('api_key', $body);
        $apiKey = null;

        if ($apiKeyProvided) {
            $rawKey = $body['api_key'];

            if ($rawKey !== null && !is_string($rawKey)) {
                $errors[] = new ValidationError('api_key', 'API key must be a string.', 'invalid');
            } elseif (is_string($rawKey) && trim($rawKey) !== '') {
                $apiKey = trim($rawKey);

                if (strlen($apiKey) < 20) {
                    $errors[] = new ValidationError('api_key', 'API key looks too short.', 'invalid');
                }
            }
        }

        $model = self::DEFAULT_MODEL;

        if (array_key_exists('model', $body)) {
            if (!is_string($body['model']) || trim($body['model']) === '') {
                $errors[] = new ValidationError('model', 'Model is required.', 'required');
            } else {
                $model = trim($body['model']);
            }
        }

        $maxTokens = 1024;

        if (array_key_exists('max_tokens', $body)) {
            if (!is_int($body['max_tokens']) && !is_string($body['max_tokens'])) {
                $errors[] = new ValidationError('max_tokens', 'Max tokens must be an integer.', 'invalid');
            } else {
                $maxTokens = max(1, min(8192, (int) $body['max_tokens']));
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return new UpdateLlmSettingsInput(
            apiKeyProvided: $apiKeyProvided,
            apiKey: $apiKey,
            model: $model,
            maxTokens: $maxTokens,
        );
    }

    /**
     * @param array<string, mixed> $body
     */
    public function validateTest(array $body): TestLlmConnectionInput
    {
        $apiKey = null;

        if (array_key_exists('api_key', $body)) {
            $rawKey = $body['api_key'];

            if ($rawKey !== null && !is_string($rawKey)) {
                throw new ValidationException([
                    new ValidationError('api_key', 'API key must be a string.', 'invalid'),
                ]);
            }

            if (is_string($rawKey) && trim($rawKey) !== '') {
                $apiKey = trim($rawKey);
            }
        }

        $model = self::DEFAULT_MODEL;

        if (array_key_exists('model', $body) && is_string($body['model']) && trim($body['model']) !== '') {
            $model = trim($body['model']);
        }

        return new TestLlmConnectionInput(apiKey: $apiKey, model: $model);
    }
}
