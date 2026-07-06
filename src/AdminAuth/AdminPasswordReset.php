<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Http\ClockInterface;

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

    public function isExpired(ClockInterface $clock): bool
    {
        return strtotime($this->expiresAt) < $clock->now()->getTimestamp();
    }

    public function isUsed(): bool
    {
        return $this->usedAt !== null;
    }
}
