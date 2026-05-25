<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

use Nene2\Routing\Router;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class DeleteSourceHandler
{
    public function __construct(
        private DeleteSourceUseCaseInterface $useCase,
        private ResponseFactoryInterface $responseFactory,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        if ($id <= 0) {
            throw new SourceNotFoundException($id);
        }

        $this->useCase->execute($id);

        return $this->responseFactory->createResponse(204);
    }
}
