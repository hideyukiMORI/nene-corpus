<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

use NeneCorpus\Llm\GenerateChatReplyUseCase;

final readonly class ChatSettingsView
{
    public function __construct(
        public ?string $systemPrompt,
        public ?string $fallbackMessage,
        public string $defaultSystemPrompt,
        public string $defaultFallbackMessage,
    ) {
    }

    /**
     * @return array{
     *     system_prompt: string|null,
     *     fallback_message: string|null,
     *     default_system_prompt: string,
     *     default_fallback_message: string,
     * }
     */
    public function toArray(): array
    {
        return [
            'system_prompt' => $this->systemPrompt,
            'fallback_message' => $this->fallbackMessage,
            'default_system_prompt' => $this->defaultSystemPrompt,
            'default_fallback_message' => $this->defaultFallbackMessage,
        ];
    }

    public static function fromSettings(ChatSettings $settings): self
    {
        return new self(
            systemPrompt: $settings->systemPrompt,
            fallbackMessage: $settings->fallbackMessage,
            defaultSystemPrompt: GenerateChatReplyUseCase::DEFAULT_SYSTEM_PROMPT,
            defaultFallbackMessage: GenerateChatReplyUseCase::DEFAULT_FALLBACK_MESSAGE,
        );
    }
}
