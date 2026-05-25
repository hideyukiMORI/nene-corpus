<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

final readonly class CreateChatSessionOutput
{
    public function __construct(
        public int $sessionId,
        public string $sessionToken,
    ) {
    }
}
