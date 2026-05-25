<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use Nene2\Error\DomainExceptionHandlerInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Throwable;

final readonly class CsvIngestionExceptionHandler implements DomainExceptionHandlerInterface
{
    public function __construct(
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function supports(Throwable $exception): bool
    {
        return $exception instanceof CsvIngestionException;
    }

    public function handle(Throwable $exception, ServerRequestInterface $request): ResponseInterface
    {
        if (!$exception instanceof CsvIngestionException) {
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
