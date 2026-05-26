<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

final readonly class UpdateChatSettingsInput
{
    public function __construct(
        public ?string $systemPrompt,
        public ?string $fallbackMessage,
    ) {
    }
}
