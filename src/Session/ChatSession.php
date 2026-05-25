<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

final readonly class ChatSession
{
    public function __construct(
        public string $publicToken,
        public ?int $id = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
        public ?string $clientIp = null,
        public ?string $userAgent = null,
        public ?string $referer = null,
    ) {
    }
}
