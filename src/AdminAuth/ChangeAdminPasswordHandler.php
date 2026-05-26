<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ChangeAdminPasswordHandler
{
    public function __construct(
        private ChangeAdminPasswordUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        /** @var array<string, mixed>|null $claims */
        $claims = $request->getAttribute('nene2.auth.claims');
        $adminId = isset($claims['sub']) ? (int) $claims['sub'] : null;

        if ($adminId === null) {
            throw new ValidationException([
                new ValidationError('auth', 'Unauthorized.', 'unauthorized'),
            ]);
        }

        $body = JsonRequestBodyParser::parse($request);

        $currentPassword = (string) ($body['current_password'] ?? '');
        $newPassword     = (string) ($body['new_password'] ?? '');

        $errors = [];

        if ($currentPassword === '') {
            $errors[] = new ValidationError('current_password', 'Current password is required.', 'required');
        }

        if ($newPassword === '') {
            $errors[] = new ValidationError('new_password', 'New password is required.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $this->useCase->execute(new ChangeAdminPasswordInput(
            adminId: $adminId,
            currentPassword: $currentPassword,
            newPassword: $newPassword,
        ));

        return $this->response->create(['success' => true]);
    }
}
