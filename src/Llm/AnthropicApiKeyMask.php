<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

final readonly class AnthropicApiKeyMask
{
    public static function mask(?string $apiKey): ?string
    {
        if ($apiKey === null || $apiKey === '') {
            return null;
        }

        $length = strlen($apiKey);

        if ($length <= 8) {
            return '••••';
        }

        $prefix = substr($apiKey, 0, min(7, $length - 4));
        $suffix = substr($apiKey, -4);

        return $prefix . '…' . $suffix;
    }
}
