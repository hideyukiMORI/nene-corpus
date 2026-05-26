<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

final readonly class ChatSettings
{
    public function __construct(
        public ?string $systemPrompt,
        public ?string $fallbackMessage,
    ) {
    }

    public static function defaults(): self
    {
        return new self(
            systemPrompt: null,
            fallbackMessage: null,
        );
    }
}
