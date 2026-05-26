<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;

final readonly class ChatSettingsValidator
{
    private const SYSTEM_PROMPT_MAX = 4000;

    private const FALLBACK_MESSAGE_MAX = 500;

    /**
     * @param array<string, mixed> $body
     */
    public function validateUpdate(array $body): UpdateChatSettingsInput
    {
        $errors = [];
        $systemPrompt = null;

        if (array_key_exists('system_prompt', $body)) {
            $raw = $body['system_prompt'];

            if ($raw !== null) {
                if (!is_string($raw)) {
                    $errors[] = new ValidationError('system_prompt', 'Must be a string or null.', 'invalid_type');
                } else {
                    $trimmed = trim($raw);

                    if ($trimmed !== '' && mb_strlen($trimmed) > self::SYSTEM_PROMPT_MAX) {
                        $errors[] = new ValidationError(
                            'system_prompt',
                            'Must not exceed ' . self::SYSTEM_PROMPT_MAX . ' characters.',
                            'too_long',
                        );
                    } else {
                        $systemPrompt = $trimmed !== '' ? $trimmed : null;
                    }
                }
            }
        }

        $fallbackMessage = null;

        if (array_key_exists('fallback_message', $body)) {
            $raw = $body['fallback_message'];

            if ($raw !== null) {
                if (!is_string($raw)) {
                    $errors[] = new ValidationError('fallback_message', 'Must be a string or null.', 'invalid_type');
                } else {
                    $trimmed = trim($raw);

                    if ($trimmed !== '' && mb_strlen($trimmed) > self::FALLBACK_MESSAGE_MAX) {
                        $errors[] = new ValidationError(
                            'fallback_message',
                            'Must not exceed ' . self::FALLBACK_MESSAGE_MAX . ' characters.',
                            'too_long',
                        );
                    } else {
                        $fallbackMessage = $trimmed !== '' ? $trimmed : null;
                    }
                }
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return new UpdateChatSettingsInput(
            systemPrompt: $systemPrompt,
            fallbackMessage: $fallbackMessage,
        );
    }
}
