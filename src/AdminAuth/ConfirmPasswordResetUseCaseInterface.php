<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

interface ConfirmPasswordResetUseCaseInterface
{
    /**
     * Validates the reset token and updates the admin password.
     *
     * @throws InvalidPasswordResetTokenException when the token is missing, expired, or already used.
     */
    public function execute(string $rawToken, string $newPassword): void;
}
