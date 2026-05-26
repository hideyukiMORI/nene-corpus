<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;

final readonly class ChangeAdminPasswordUseCase implements ChangeAdminPasswordUseCaseInterface
{
    private const MIN_PASSWORD_LENGTH = 8;

    public function __construct(
        private AdminUserRepositoryInterface $adminUsers,
    ) {
    }

    public function execute(ChangeAdminPasswordInput $input): void
    {
        $user = $this->adminUsers->findById($input->adminId);

        if ($user === null || !password_verify($input->currentPassword, $user->passwordHash)) {
            throw new ValidationException([
                new ValidationError('current_password', 'Current password is incorrect.', 'invalid'),
            ]);
        }

        if (strlen($input->newPassword) < self::MIN_PASSWORD_LENGTH) {
            throw new ValidationException([
                new ValidationError('new_password', 'Password must be at least 8 characters.', 'min_length'),
            ]);
        }

        $newHash = password_hash($input->newPassword, PASSWORD_ARGON2ID);

        $this->adminUsers->updatePassword($input->adminId, $newHash);
    }
}
