<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Error\DomainExceptionHandlerInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Throwable;

final readonly class AdminJwtNotConfiguredExceptionHandler implements DomainExceptionHandlerInterface
{
    public function __construct(
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function supports(Throwable $exception): bool
    {
        return $exception instanceof AdminJwtNotConfiguredException;
    }

    public function handle(Throwable $exception, ServerRequestInterface $request): ResponseInterface
    {
        return $this->problemDetails->create(
            $request,
            'admin-jwt-not-configured',
            'Service Unavailable',
            503,
            'Admin JWT secret is not configured. Complete the web installer first.',
        );
    }
}
