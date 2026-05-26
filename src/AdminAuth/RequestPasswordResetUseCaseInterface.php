<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

interface RequestPasswordResetUseCaseInterface
{
    /**
     * Issues a password reset token and sends a reset email if the email matches a known admin.
     * Always succeeds regardless of whether the email exists (enumeration prevention).
     */
    public function execute(string $email, string $resetBaseUrl): void;
}
