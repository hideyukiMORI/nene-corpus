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
        '/admin/auth/password-reset/request',
        '/admin/auth/password-reset/confirm',
        '/admin/notifications/daily-report',
        '/admin/bootstrap',
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

        // Wrap handler to extract role + org_id from JWT claims into typed request attributes
        $wrappedHandler = new class ($handler) implements RequestHandlerInterface {
            public function __construct(private readonly RequestHandlerInterface $inner)
            {
            }

            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                /** @var array<string, mixed>|null $claims */
                $claims = $request->getAttribute('nene2.auth.claims');

                if (is_array($claims)) {
                    $orgId = isset($claims['org_id']) && is_int($claims['org_id']) ? $claims['org_id'] : null;
                    $request = $request
                        ->withAttribute('nene-corpus.auth.role', (string) ($claims['role'] ?? 'admin'))
                        ->withAttribute('nene-corpus.auth.org_id', $orgId);
                }

                return $this->inner->handle($request);
            }
        };

        return $this->bearer->process($request, $wrappedHandler);
    }
}
