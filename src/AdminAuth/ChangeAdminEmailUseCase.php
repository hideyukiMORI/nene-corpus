<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;

final readonly class ChangeAdminEmailUseCase implements ChangeAdminEmailUseCaseInterface
{
    public function __construct(
        private AdminUserRepositoryInterface $adminUsers,
    ) {
    }

    public function execute(ChangeAdminEmailInput $input): void
    {
        $user = $this->adminUsers->findById($input->adminId);

        if ($user === null || !password_verify($input->currentPassword, $user->passwordHash)) {
            throw new ValidationException([
                new ValidationError('current_password', 'Current password is incorrect.', 'invalid'),
            ]);
        }

        if (filter_var($input->newEmail, FILTER_VALIDATE_EMAIL) === false) {
            throw new ValidationException([
                new ValidationError('new_email', 'Please enter a valid email address.', 'invalid_format'),
            ]);
        }

        $this->adminUsers->updateEmail($input->adminId, $input->newEmail);
    }
}
