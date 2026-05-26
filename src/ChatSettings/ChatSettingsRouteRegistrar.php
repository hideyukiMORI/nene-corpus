<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ChatSettingsRouteRegistrar
{
    public function __construct(
        private GetChatSettingsHandler $getHandler,
        private UpdateChatSettingsHandler $updateHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $get = $this->getHandler;
        $update = $this->updateHandler;

        $router->get(
            '/admin/settings/chat',
            static fn (ServerRequestInterface $request) => $get->handle($request),
        );

        $router->put(
            '/admin/settings/chat',
            static fn (ServerRequestInterface $request) => $update->handle($request),
        );
    }
}
