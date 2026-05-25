<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class SourceRouteRegistrar
{
    public function __construct(
        private DeleteSourceHandler $deleteHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $delete = $this->deleteHandler;

        $router->delete(
            '/admin/sources/{id}',
            static fn (ServerRequestInterface $request) => $delete->handle($request),
        );
    }
}
