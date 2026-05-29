<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class OrganizationRouteRegistrar
{
    public function __construct(
        private ListOrganizationsHandler $listHandler,
        private GetOrganizationByIdHandler $getHandler,
        private CreateOrganizationHandler $createHandler,
        private UpdateOrganizationHandler $updateHandler,
        private DeleteOrganizationHandler $deleteHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list   = $this->listHandler;
        $get    = $this->getHandler;
        $create = $this->createHandler;
        $update = $this->updateHandler;
        $delete = $this->deleteHandler;

        $router->get(
            '/admin/superadmin/organizations',
            static fn (ServerRequestInterface $request) => $list->handle($request),
        );

        $router->get(
            '/admin/superadmin/organizations/{id}',
            static fn (ServerRequestInterface $request) => $get->handle($request),
        );

        $router->post(
            '/admin/superadmin/organizations',
            static fn (ServerRequestInterface $request) => $create->handle($request),
        );

        $router->put(
            '/admin/superadmin/organizations/{id}',
            static fn (ServerRequestInterface $request) => $update->handle($request),
        );

        $router->delete(
            '/admin/superadmin/organizations/{id}',
            static fn (ServerRequestInterface $request) => $delete->handle($request),
        );
    }
}
