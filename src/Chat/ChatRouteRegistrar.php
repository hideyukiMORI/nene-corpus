<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ChatRouteRegistrar
{
    public function __construct(
        private CreateChatSessionHandler $createSessionHandler,
        private SendChatMessageHandler $sendMessageHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $createSession = $this->createSessionHandler;
        $sendMessage = $this->sendMessageHandler;

        $router->post('/chat/sessions', static fn (ServerRequestInterface $request) => $createSession->handle($request));
        $router->post('/chat/messages', static fn (ServerRequestInterface $request) => $sendMessage->handle($request));
    }
}
