<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use RuntimeException;

final readonly class TestLlmConnectionHandler
{
    public function __construct(
        private TestLlmConnectionUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);

        try {
            $this->useCase->executeFromBody($body);
        } catch (RuntimeException $exception) {
            throw new ValidationException([
                new ValidationError('api_key', $exception->getMessage(), 'invalid'),
            ]);
        }

        return $this->response->create(['ok' => true]);
    }
}
