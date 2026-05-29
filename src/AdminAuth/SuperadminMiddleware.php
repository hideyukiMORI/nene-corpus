<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Error\ProblemDetailsResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Restricts access to /admin/superadmin/* routes to users with role = 'superadmin'.
 *
 * Must be applied after AdminBearerTokenMiddleware has set the JWT claims
 * in the request attribute 'nene2.auth.claims'.
 */
final readonly class SuperadminMiddleware implements MiddlewareInterface
{
    public function __construct(
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $path = $request->getUri()->getPath() ?: '/';

        if (!str_starts_with($path, '/admin/superadmin/')) {
            return $handler->handle($request);
        }

        /** @var array<string, mixed>|null $claims */
        $claims = $request->getAttribute('nene2.auth.claims');

        if (!is_array($claims)) {
            return $this->problemDetails->create($request, 'unauthorized', 'Unauthorized', 401);
        }

        $role = (string) ($claims['role'] ?? '');

        if ($role !== Role::Superadmin->value) {
            return $this->problemDetails->create(
                $request,
                'forbidden',
                'Forbidden',
                403,
                'Superadmin role is required for this endpoint.',
            );
        }

        return $handler->handle($request);
    }
}
