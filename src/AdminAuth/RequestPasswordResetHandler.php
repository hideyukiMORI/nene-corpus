<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class RequestPasswordResetHandler
{
    public function __construct(
        private RequestPasswordResetUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);

        $email = strtolower(trim((string) ($body['email'] ?? '')));

        if ($email === '') {
            throw new ValidationException([new ValidationError('email', 'Email is required.', 'required')]);
        }

        // Build the reset URL base from the request: scheme + host + /admin/
        $uri = $request->getUri();
        $resetBaseUrl = $uri->getScheme() . '://' . $uri->getHost()
            . (in_array($uri->getPort(), [null, 80, 443], true) ? '' : ':' . $uri->getPort())
            . '/admin/';

        $this->useCase->execute($email, $resetBaseUrl);

        // Always return 200 — do not reveal whether the email exists
        return $this->response->create(['message' => 'If the email address is registered, a reset link has been sent.'], 200);
    }
}
