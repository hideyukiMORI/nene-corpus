<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class SourceRouteRegistrar
{
    public function __construct(
        private DeleteSourceHandler $deleteHandler,
        private ListSourcesHandler $listHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $delete = $this->deleteHandler;
        $list = $this->listHandler;

        $router->get(
            '/admin/sources',
            static fn (ServerRequestInterface $request) => $list->handle($request),
        );

        $router->delete(
            '/admin/sources/{id}',
            static fn (ServerRequestInterface $request) => $delete->handle($request),
        );
    }
}
