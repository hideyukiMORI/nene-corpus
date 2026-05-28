<?php

declare(strict_types=1);

namespace NeneCorpus\Bootstrap;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class BootstrapRouteRegistrar
{
    public function __construct(
        private GetBootstrapInfoHandler $getBootstrapInfoHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $handler = $this->getBootstrapInfoHandler;

        // Public endpoint — no auth required.
        // Returns tenant_resolution_mode + tenant_org_slug for the Admin SPA.
        $router->get(
            '/admin/bootstrap',
            static fn (ServerRequestInterface $request) => $handler->handle($request),
        );
    }
}
