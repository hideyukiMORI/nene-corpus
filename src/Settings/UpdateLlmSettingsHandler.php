<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class UpdateLlmSettingsHandler
{
    public function __construct(
        private UpdateLlmSettingsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);

        return $this->response->create($this->useCase->executeFromBody($body)->toArray());
    }
}
