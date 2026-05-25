<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class InstallRouteRegistrar
{
    public function __construct(
        private GetInstallStatusHandler $getStatusHandler,
        private RunInstallHandler $runInstallHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $getStatus = $this->getStatusHandler;
        $runInstall = $this->runInstallHandler;

        $router->get(
            '/install/status',
            static fn (ServerRequestInterface $request) => $getStatus->handle($request),
        );

        $router->post(
            '/install',
            static fn (ServerRequestInterface $request) => $runInstall->handle($request),
        );
    }
}
