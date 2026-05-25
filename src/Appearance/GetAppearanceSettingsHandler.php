<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class GetAppearanceSettingsHandler
{
    public function __construct(
        private GetAppearanceSettingsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        return $this->response->create($this->useCase->execute()->toArray());
    }
}
