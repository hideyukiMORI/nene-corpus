<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use Nene2\Error\DomainExceptionHandlerInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Throwable;

final readonly class DocumentValidationExceptionHandler implements DomainExceptionHandlerInterface
{
    public function __construct(
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function supports(Throwable $exception): bool
    {
        return $exception instanceof DocumentValidationException;
    }

    public function handle(Throwable $exception, ServerRequestInterface $request): ResponseInterface
    {
        if (!$exception instanceof DocumentValidationException) {
            throw $exception;
        }

        return $this->problemDetails->create(
            $request,
            'validation-failed',
            'Validation Failed',
            422,
            'The request body contains invalid values.',
            [
                'errors' => [
                    [
                        'field' => $exception->field,
                        'message' => $exception->getMessage(),
                        'code' => 'invalid',
                    ],
                ],
            ],
        );
    }
}
