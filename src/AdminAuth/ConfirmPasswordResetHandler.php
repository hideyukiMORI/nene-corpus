<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ConfirmPasswordResetHandler
{
    public function __construct(
        private ConfirmPasswordResetUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);

        $token = trim((string) ($body['token'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        $errors = [];

        if ($token === '') {
            $errors[] = new ValidationError('token', 'Token is required.', 'required');
        }

        if ($password === '') {
            $errors[] = new ValidationError('password', 'Password is required.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $this->useCase->execute($token, $password);

        return $this->response->create(['message' => 'Password has been reset successfully. Please log in with your new password.'], 200);
    }
}
