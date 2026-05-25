<?php

declare(strict_types=1);

namespace NeneCorpus\Http;

use NeneCorpus\Install\InstallPathResolver;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Strips the public base path prefix so routes match when the app lives in a subdirectory.
 */
final readonly class BasePathMiddleware implements MiddlewareInterface
{
    public function __construct(
        private InstallPathResolver $pathResolver,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $basePath = $this->pathResolver->resolve();

        if ($basePath === '') {
            return $handler->handle($request);
        }

        $path = $request->getUri()->getPath() ?: '/';

        if ($path === $basePath) {
            $path = '/';
        } elseif (str_starts_with($path, $basePath . '/')) {
            $path = substr($path, strlen($basePath)) ?: '/';
        }

        return $handler->handle($request->withUri($request->getUri()->withPath($path)));
    }
}
