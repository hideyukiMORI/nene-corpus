<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

final readonly class LoginAdminOutput
{
    public function __construct(
        public string $accessToken,
        public string $tokenType,
        public string $expiresAt,
    ) {
    }
}
