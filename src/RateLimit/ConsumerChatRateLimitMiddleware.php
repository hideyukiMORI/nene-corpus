<?php

declare(strict_types=1);

namespace NeneCorpus\RateLimit;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Middleware\RateLimitStorageInterface;
use NeneCorpus\Chat\SendChatMessageHandler;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Applies fixed-window rate limits to consumer sync JSON chat before LLM calls.
 */
final readonly class ConsumerChatRateLimitMiddleware implements MiddlewareInterface
{
    private const CHAT_MESSAGES_PATH = '/chat/messages';

    public function __construct(
        private ProblemDetailsResponseFactory $problemDetails,
        private RateLimitStorageInterface $storage,
        private ChatRateLimitConfig $config,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $path = $request->getUri()->getPath() ?: '/';

        if ($path !== self::CHAT_MESSAGES_PATH || strtoupper($request->getMethod()) !== 'POST') {
            return $handler->handle($request);
        }

        $windowSeconds = $this->config->windowSeconds;
        $ipKey = 'chat:ip:' . $this->clientIp($request);
        $ipResult = $this->storage->hit($ipKey, $windowSeconds);

        if ($ipResult['count'] > $this->config->ipLimit) {
            return $this->tooManyRequests(
                $request,
                $this->config->ipLimit,
                $windowSeconds,
                $ipResult['reset_at'],
                'IP',
            );
        }

        $sessionToken = trim($request->getHeaderLine(SendChatMessageHandler::SESSION_TOKEN_HEADER));

        if ($sessionToken !== '') {
            $sessionKey = 'chat:session:' . $sessionToken;
            $sessionResult = $this->storage->hit($sessionKey, $windowSeconds);

            if ($sessionResult['count'] > $this->config->sessionLimit) {
                return $this->tooManyRequests(
                    $request,
                    $this->config->sessionLimit,
                    $windowSeconds,
                    $sessionResult['reset_at'],
                    'session',
                );
            }

            $remaining = min(
                $this->config->sessionLimit - $sessionResult['count'],
                $this->config->ipLimit - $ipResult['count'],
            );
            $resetAt = min($sessionResult['reset_at'], $ipResult['reset_at']);
        } else {
            $remaining = $this->config->ipLimit - $ipResult['count'];
            $resetAt = $ipResult['reset_at'];
        }

        return $this->withRateLimitHeaders(
            $handler->handle($request),
            min($this->config->sessionLimit, $this->config->ipLimit),
            max(0, $remaining),
            $resetAt,
        );
    }

    private function clientIp(ServerRequestInterface $request): string
    {
        $params = $request->getServerParams();

        return (string) ($params['REMOTE_ADDR'] ?? 'unknown');
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
