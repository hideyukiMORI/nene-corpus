<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class DeleteOrganizationHandler
{
    public function __construct(
        private DeleteOrganizationUseCaseInterface $useCase,
        private ResponseFactoryInterface $responseFactory,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $id = (int) ($request->getAttribute('id') ?? 0);

        $this->useCase->execute(new DeleteOrganizationInput(id: $id));

        return $this->responseFactory->createResponse(204);
    }
}
