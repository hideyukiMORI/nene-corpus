<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Middleware\RateLimitStorageInterface;
use NeneCorpus\Http\RequestMetadataExtractor;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Protects POST /admin/auth/login against brute-force attacks.
 *
 * Limits login attempts to MAX_ATTEMPTS per IP per WINDOW_SECONDS.
 * Uses the shared PdoRateLimitStorage (rate_limit_buckets table).
 */
final readonly class AdminLoginRateLimitMiddleware implements MiddlewareInterface
{
    private const LOGIN_PATH = '/admin/auth/login';

    /** Maximum login attempts allowed within the window. */
    private const MAX_ATTEMPTS = 10;

    /** Rate-limit window in seconds (15 minutes). */
    private const WINDOW_SECONDS = 900;

    public function __construct(
        private ProblemDetailsResponseFactory $problemDetails,
        private RateLimitStorageInterface $storage,
        private ClockInterface $clock,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        if (
            strtoupper($request->getMethod()) !== 'POST'
            || $request->getUri()->getPath() !== self::LOGIN_PATH
        ) {
            return $handler->handle($request);
        }

        $ip  = RequestMetadataExtractor::clientIp($request) ?? 'unknown';
        $key = 'admin:login:ip:' . $ip;

        $result = $this->storage->hit($key, self::WINDOW_SECONDS);

        if ($result['count'] > self::MAX_ATTEMPTS) {
            $retryAfter = max(0, $result['reset_at'] - $this->clock->now()->getTimestamp());
            $response   = $this->problemDetails->create(
                $request,
                'too_many_requests',
                'Too many login attempts. Please try again later.',
                429,
                'Rate limit exceeded: ' . self::MAX_ATTEMPTS . ' attempts per ' . (self::WINDOW_SECONDS / 60) . ' minutes.',
            );

            return $response->withHeader('Retry-After', (string) $retryAfter);
        }

        return $handler->handle($request);
    }
}
