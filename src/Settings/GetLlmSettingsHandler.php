<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class GetLlmSettingsHandler
{
    public function __construct(
        private GetLlmSettingsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        return $this->response->create($this->useCase->execute()->toArray());
    }
}
