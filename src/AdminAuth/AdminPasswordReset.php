<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

final readonly class AdminPasswordReset
{
    public function __construct(
        public string $tokenHash,
        public int $adminUserId,
        public string $expiresAt,
        public ?string $usedAt,
        public string $createdAt,
        public ?int $id = null,
    ) {
    }

    public function isExpired(): bool
    {
        return strtotime($this->expiresAt) < time();
    }

    public function isUsed(): bool
    {
        return $this->usedAt !== null;
    }
}
