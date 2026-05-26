<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;

final readonly class ChatLimitsValidator
{
    /**
     * @param array<string, mixed> $body
     */
    public function validateUpdate(array $body): UpdateChatLimitsInput
    {
        /** @var list<ValidationError> $errors */
        $errors = [];

        $maxMessageChars = $this->validateNonNegativeInt('max_message_chars', $body, $errors);
        $messageIntervalSeconds = $this->validateNonNegativeInt('message_interval_seconds', $body, $errors);
        $sessionRequestsPerHour = $this->validateNonNegativeInt('session_requests_per_hour', $body, $errors);
        $ipRequestsPerHour = $this->validateNonNegativeInt('ip_requests_per_hour', $body, $errors);
        $dailyRequestsPerIp = $this->validateNonNegativeInt('daily_requests_per_ip', $body, $errors);
        $dailyRequestsGlobal = $this->validateNonNegativeInt('daily_requests_global', $body, $errors);

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return new UpdateChatLimitsInput(
            maxMessageChars: $maxMessageChars,
            messageIntervalSeconds: $messageIntervalSeconds,
            sessionRequestsPerHour: $sessionRequestsPerHour,
            ipRequestsPerHour: $ipRequestsPerHour,
            dailyRequestsPerIp: $dailyRequestsPerIp,
            dailyRequestsGlobal: $dailyRequestsGlobal,
        );
    }

    /**
     * Returns the parsed non-negative integer, or 0 as a fallback when an error is recorded.
     *
     * @param array<string, mixed>  $body
     * @param list<ValidationError> $errors
     */
    private function validateNonNegativeInt(string $field, array $body, array &$errors): int
    {
        $raw = $body[$field] ?? null;

        if ($raw === null) {
            $errors[] = new ValidationError($field, 'This field is required.', 'required');

            return 0;
        }

        if (!is_int($raw) && !(is_string($raw) && ctype_digit($raw))) {
            $errors[] = new ValidationError($field, 'Must be a non-negative integer.', 'invalid_type');

            return 0;
        }

        $value = (int) $raw;

        if ($value < 0) {
            $errors[] = new ValidationError($field, 'Must be 0 or greater.', 'min');

            return 0;
        }

        return $value;
    }
}
