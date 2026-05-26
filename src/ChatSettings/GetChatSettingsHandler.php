<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class GetChatSettingsHandler
{
    public function __construct(
        private GetChatSettingsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        return $this->response->create($this->useCase->execute()->toArray());
    }
}
