<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Http\ClockInterface;

final readonly class ConfirmPasswordResetUseCase implements ConfirmPasswordResetUseCaseInterface
{
    private const MIN_PASSWORD_LENGTH = 8;

    public function __construct(
        private AdminPasswordResetRepositoryInterface $resets,
        private AdminUserRepositoryInterface $users,
        private ClockInterface $clock,
    ) {
    }

    public function execute(string $rawToken, string $newPassword): void
    {
        if ($rawToken === '') {
            throw new InvalidPasswordResetTokenException('Token is required.');
        }

        if (mb_strlen($newPassword) < self::MIN_PASSWORD_LENGTH) {
            throw new InvalidPasswordResetTokenException('Password must be at least ' . self::MIN_PASSWORD_LENGTH . ' characters.');
        }

        $tokenHash = hash('sha256', $rawToken);
        $reset = $this->resets->findByTokenHash($tokenHash);

        if ($reset === null || $reset->isExpired($this->clock) || $reset->isUsed()) {
            throw new InvalidPasswordResetTokenException('The reset token is invalid, expired, or already used.');
        }

        $user = $this->users->findById($reset->adminUserId);

        if ($user === null || $user->id === null) {
            throw new InvalidPasswordResetTokenException('Admin user not found.');
        }

        $newHash = password_hash($newPassword, PASSWORD_ARGON2ID);

        $this->users->updatePassword($user->id, $newHash);
        $this->resets->markUsed($tokenHash);
    }
}
