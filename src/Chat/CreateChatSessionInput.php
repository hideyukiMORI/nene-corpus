<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

final readonly class CreateChatSessionInput
{
    public function __construct(
        public ?string $clientIp = null,
        public ?string $userAgent = null,
        public ?string $referer = null,
    ) {
    }
}
