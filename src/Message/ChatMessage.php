<?php

declare(strict_types=1);

namespace NeneCorpus\Message;

final readonly class ChatMessage
{
    public function __construct(
        public int $sessionId,
        public MessageRole $role,
        public string $content,
        public ?string $citationsJson = null,
        public ?int $inputTokens = null,
        public ?int $outputTokens = null,
        public ?int $id = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }
}
