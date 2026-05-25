<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class DocumentRouteRegistrar
{
    public function __construct(
        private ListDocumentsHandler $listHandler,
        private GetDocumentHandler $getHandler,
        private UpdateDocumentHandler $updateHandler,
        private DeleteDocumentHandler $deleteHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list = $this->listHandler;
        $get = $this->getHandler;
        $update = $this->updateHandler;
        $delete = $this->deleteHandler;

        $router->get(
            '/admin/sources/{sourceId}/documents',
            static fn (ServerRequestInterface $request) => $list->handle($request),
        );

        $router->get(
            '/admin/documents/{id}',
            static fn (ServerRequestInterface $request) => $get->handle($request),
        );

        $router->put(
            '/admin/documents/{id}',
            static fn (ServerRequestInterface $request) => $update->handle($request),
        );

        $router->delete(
            '/admin/documents/{id}',
            static fn (ServerRequestInterface $request) => $delete->handle($request),
        );
    }
}
