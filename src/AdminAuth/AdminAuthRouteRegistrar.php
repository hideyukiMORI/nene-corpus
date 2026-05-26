<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class AdminAuthRouteRegistrar
{
    public function __construct(
        private LoginAdminHandler $loginHandler,
        private GetAdminMeHandler $meHandler,
        private ChangeAdminPasswordHandler $changePasswordHandler,
        private ChangeAdminEmailHandler $changeEmailHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $login          = $this->loginHandler;
        $me             = $this->meHandler;
        $changePassword = $this->changePasswordHandler;
        $changeEmail    = $this->changeEmailHandler;

        $router->post('/admin/auth/login', static fn (ServerRequestInterface $request) => $login->handle($request));
        $router->get('/admin/auth/me', static fn (ServerRequestInterface $request) => $me->handle($request));
        $router->put('/admin/auth/password', static fn (ServerRequestInterface $request) => $changePassword->handle($request));
        $router->put('/admin/auth/email', static fn (ServerRequestInterface $request) => $changeEmail->handle($request));
    }
}
