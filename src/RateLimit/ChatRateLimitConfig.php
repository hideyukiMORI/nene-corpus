<?php

declare(strict_types=1);

namespace NeneCorpus\RateLimit;

final readonly class ChatRateLimitConfig
{
    private const DEFAULT_SESSION_LIMIT = 20;

    private const DEFAULT_IP_LIMIT = 60;

    private const DEFAULT_WINDOW_SECONDS = 3600;

    public function __construct(
        public int $sessionLimit,
        public int $ipLimit,
        public int $windowSeconds,
    ) {
    }

    public static function fromEnvironment(): self
    {
        return new self(
            sessionLimit: self::readPositiveInt('NENE_CORPUS_CHAT_RATE_LIMIT_SESSION', self::DEFAULT_SESSION_LIMIT),
            ipLimit: self::readPositiveInt('NENE_CORPUS_CHAT_RATE_LIMIT_IP', self::DEFAULT_IP_LIMIT),
            windowSeconds: self::readPositiveInt('NENE_CORPUS_CHAT_RATE_LIMIT_WINDOW', self::DEFAULT_WINDOW_SECONDS),
        );
    }

    private static function readPositiveInt(string $key, int $default): int
    {
        $raw = $_ENV[$key] ?? $_SERVER[$key] ?? null;

        if (!is_string($raw) || trim($raw) === '') {
            return $default;
        }

        return max(1, (int) $raw);
    }
}
