<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class GetChatLimitsHandler
{
    public function __construct(
        private GetChatLimitsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        return $this->response->create($this->useCase->execute()->toArray());
    }
}
