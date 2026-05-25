<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

final readonly class AdminUser
{
    public function __construct(
        public string $email,
        public string $passwordHash,
        public ?int $id = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }
}
