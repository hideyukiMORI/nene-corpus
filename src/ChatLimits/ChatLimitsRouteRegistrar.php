<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ChatLimitsRouteRegistrar
{
    public function __construct(
        private GetChatLimitsHandler $getHandler,
        private UpdateChatLimitsHandler $updateHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $get = $this->getHandler;
        $update = $this->updateHandler;

        $router->get(
            '/admin/settings/limits',
            static fn (ServerRequestInterface $request) => $get->handle($request),
        );

        $router->put(
            '/admin/settings/limits',
            static fn (ServerRequestInterface $request) => $update->handle($request),
        );
    }
}
