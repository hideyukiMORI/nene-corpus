<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class SystemConfigRouteRegistrar
{
    public function __construct(
        private GetSystemConfigHandler $getHandler,
        private UpdateSystemConfigHandler $updateHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $get    = $this->getHandler;
        $update = $this->updateHandler;

        $router->get(
            '/admin/superadmin/system-config',
            static fn (ServerRequestInterface $request) => $get->handle($request),
        );

        $router->patch(
            '/admin/superadmin/system-config',
            static fn (ServerRequestInterface $request) => $update->handle($request),
        );
    }
}
