<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Auth\BearerTokenMiddleware;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Applies Bearer JWT verification to /admin/* routes except public auth endpoints.
 */
final readonly class AdminBearerTokenMiddleware implements MiddlewareInterface
{
    /** @var list<string> */
    private const PUBLIC_PATHS = [
        '/admin/auth/login',
    ];

    public function __construct(
        private BearerTokenMiddleware $bearer,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $path = $request->getUri()->getPath() ?: '/';

        if (!str_starts_with($path, '/admin/') || in_array($path, self::PUBLIC_PATHS, true)) {
            return $handler->handle($request);
        }

        return $this->bearer->process($request, $handler);
    }
}
