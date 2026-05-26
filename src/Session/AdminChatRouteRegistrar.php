<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

use Nene2\Routing\Router;
use NeneCorpus\Message\ListChatSessionMessagesHandler;
use Psr\Http\Message\ServerRequestInterface;

final readonly class AdminChatRouteRegistrar
{
    public function __construct(
        private ListChatSessionsHandler $listSessions,
        private ListChatSessionMessagesHandler $listMessages,
        private CleanupChatSessionsHandler $cleanupSessions,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $listSessions    = $this->listSessions;
        $listMessages    = $this->listMessages;
        $cleanupSessions = $this->cleanupSessions;

        $router->get(
            '/admin/chat/sessions',
            static fn (ServerRequestInterface $request) => $listSessions->handle($request),
        );

        $router->get(
            '/admin/chat/sessions/{id}/messages',
            static fn (ServerRequestInterface $request) => $listMessages->handle($request),
        );

        $router->delete(
            '/admin/chat/sessions',
            static fn (ServerRequestInterface $request) => $cleanupSessions->handle($request),
        );
    }
}
