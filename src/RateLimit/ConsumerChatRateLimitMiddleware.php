<?php

declare(strict_types=1);

namespace NeneCorpus\RateLimit;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Middleware\RateLimitStorageInterface;
use NeneCorpus\Chat\SendChatMessageHandler;
use NeneCorpus\ChatLimits\ChatLimitsRepositoryInterface;
use NeneCorpus\Http\RequestMetadataExtractor;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Applies DB-configured rate limits to consumer sync JSON chat before LLM calls.
 *
 * Checks (in order, first failure wins):
 *   1. Daily global request budget
 *   2. Daily per-IP request budget
 *   3. Hourly per-IP request limit
 *   4. Hourly per-session request limit
 *   5. Per-session message interval (minimum seconds between messages)
 */
final readonly class ConsumerChatRateLimitMiddleware implements MiddlewareInterface
{
    private const CHAT_MESSAGES_PATH = '/chat/messages';

    private const HOURLY_WINDOW = 3600;

    private const DAILY_WINDOW = 86400;

    public function __construct(
        private ProblemDetailsResponseFactory $problemDetails,
        private RateLimitStorageInterface $storage,
        private ChatLimitsRepositoryInterface $limitsRepository,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $path = $request->getUri()->getPath() ?: '/';

        if ($path !== self::CHAT_MESSAGES_PATH || strtoupper($request->getMethod()) !== 'POST') {
            return $handler->handle($request);
        }

        $limits = $this->limitsRepository->get();
        $ip = RequestMetadataExtractor::clientIp($request) ?? 'unknown';
        $sessionToken = trim($request->getHeaderLine(SendChatMessageHandler::SESSION_TOKEN_HEADER));

        // 1. Daily global budget
        if ($limits->dailyRequestsGlobal > 0) {
            $result = $this->storage->hit('chat:daily:global', self::DAILY_WINDOW);

            if ($result['count'] > $limits->dailyRequestsGlobal) {
                return $this->tooManyRequests(
                    $request,
                    $limits->dailyRequestsGlobal,
                    self::DAILY_WINDOW,
                    $result['reset_at'],
                    'global daily',
                );
            }
        }

        // 2. Daily per-IP budget
        if ($limits->dailyRequestsPerIp > 0) {
            $result = $this->storage->hit('chat:daily:ip:' . $ip, self::DAILY_WINDOW);

            if ($result['count'] > $limits->dailyRequestsPerIp) {
                return $this->tooManyRequests(
                    $request,
                    $limits->dailyRequestsPerIp,
                    self::DAILY_WINDOW,
                    $result['reset_at'],
                    'IP daily',
                );
            }
        }

        // 3. Hourly per-IP limit
        $ipCount = 0;
        $ipResetAt = time() + self::HOURLY_WINDOW;

        if ($limits->ipRequestsPerHour > 0) {
            $result = $this->storage->hit('chat:ip:' . $ip, self::HOURLY_WINDOW);
            $ipCount = $result['count'];
            $ipResetAt = $result['reset_at'];

            if ($ipCount > $limits->ipRequestsPerHour) {
                return $this->tooManyRequests(
                    $request,
                    $limits->ipRequestsPerHour,
                    self::HOURLY_WINDOW,
                    $ipResetAt,
                    'IP',
                );
            }
        }

        $sessionCount = 0;
        $sessionResetAt = time() + self::HOURLY_WINDOW;

        if ($sessionToken !== '') {
            // 4. Hourly per-session limit
            if ($limits->sessionRequestsPerHour > 0) {
                $result = $this->storage->hit('chat:session:' . $sessionToken, self::HOURLY_WINDOW);
                $sessionCount = $result['count'];
                $sessionResetAt = $result['reset_at'];

                if ($sessionCount > $limits->sessionRequestsPerHour) {
                    return $this->tooManyRequests(
                        $request,
                        $limits->sessionRequestsPerHour,
                        self::HOURLY_WINDOW,
                        $sessionResetAt,
                        'session',
                    );
                }
            }

            // 5. Per-session interval check (limit = 1 hit per interval window)
            if ($limits->messageIntervalSeconds > 0) {
                $result = $this->storage->hit(
                    'chat:interval:' . $sessionToken,
                    $limits->messageIntervalSeconds,
                );

                if ($result['count'] > 1) {
                    return $this->tooManyRequests(
                        $request,
                        1,
                        $limits->messageIntervalSeconds,
                        $result['reset_at'],
                        'session interval',
                    );
                }
            }
        }

        // Attach rate-limit headers when at least one hourly limit is active
        $sessionLimit = $limits->sessionRequestsPerHour > 0 ? $limits->sessionRequestsPerHour : null;
        $ipLimit = $limits->ipRequestsPerHour > 0 ? $limits->ipRequestsPerHour : null;

        if ($sessionLimit !== null || $ipLimit !== null) {
            $effectiveLimit = min($sessionLimit ?? PHP_INT_MAX, $ipLimit ?? PHP_INT_MAX);
            $effectiveRemaining = min(
                $sessionLimit !== null ? max(0, $sessionLimit - $sessionCount) : PHP_INT_MAX,
                $ipLimit !== null ? max(0, $ipLimit - $ipCount) : PHP_INT_MAX,
            );
            $effectiveResetAt = min($sessionResetAt, $ipResetAt);

            return $this->withRateLimitHeaders(
                $handler->handle($request),
                $effectiveLimit,
                $effectiveRemaining === PHP_INT_MAX ? 0 : $effectiveRemaining,
                $effectiveResetAt,
            );
        }

        return $handler->handle($request);
    }

    private function tooManyRequests(
        ServerRequestInterface $request,
        int $limit,
        int $windowSeconds,
        int $resetAt,
        string $scope,
    ): ResponseInterface {
        $retryAfter = max(0, $resetAt - time());

        return $this->problemDetails->create(
            $request,
            'rate-limit-exceeded',
            'Too Many Requests',
            429,
            sprintf(
                'Chat %s rate limit of %d requests per %d seconds exceeded. Try again in %d seconds.',
                $scope,
                $limit,
                $windowSeconds,
                $retryAfter,
            ),
        )
            ->withHeader('Retry-After', (string) $retryAfter)
            ->withHeader('X-RateLimit-Limit', (string) $limit)
            ->withHeader('X-RateLimit-Remaining', '0')
            ->withHeader('X-RateLimit-Reset', (string) $resetAt);
    }

    private function withRateLimitHeaders(
        ResponseInterface $response,
        int $limit,
        int $remaining,
        int $resetAt,
    ): ResponseInterface {
        return $response
            ->withHeader('X-RateLimit-Limit', (string) $limit)
            ->withHeader('X-RateLimit-Remaining', (string) $remaining)
            ->withHeader('X-RateLimit-Reset', (string) $resetAt);
    }
}
