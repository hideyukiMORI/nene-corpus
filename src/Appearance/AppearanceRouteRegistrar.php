<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class AppearanceRouteRegistrar
{
    public function __construct(
        private GetAppearanceSettingsHandler $getAdminHandler,
        private UpdateAppearanceSettingsHandler $updateAdminHandler,
        private GetWidgetAppearanceHandler $getWidgetHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $getAdmin = $this->getAdminHandler;
        $updateAdmin = $this->updateAdminHandler;
        $getWidget = $this->getWidgetHandler;

        $router->get(
            '/admin/appearance',
            static fn (ServerRequestInterface $request) => $getAdmin->handle($request),
        );

        $router->put(
            '/admin/appearance',
            static fn (ServerRequestInterface $request) => $updateAdmin->handle($request),
        );

        $router->get(
            '/widget/appearance',
            static fn (ServerRequestInterface $request) => $getWidget->handle($request),
        );
    }
}
