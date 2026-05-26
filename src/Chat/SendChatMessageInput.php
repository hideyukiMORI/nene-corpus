<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

final readonly class SendChatMessageInput
{
    public function __construct(
        public string $sessionToken,
        public string $content,
        public string $clientIp = 'unknown',
    ) {
    }
}
