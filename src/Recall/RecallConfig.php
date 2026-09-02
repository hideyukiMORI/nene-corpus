<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

/**
 * Settings for the optional NeNe Recall search backend (ADR 0007).
 *
 * Everything is read from `.env` (ADR 0004) and every value is optional: when
 * `NENE_RECALL_BASE_URL` is empty the whole integration stays off and Corpus
 * behaves exactly as before (LIKE search, no upstream writes).
 */
final readonly class RecallConfig
{
    public const DEFAULT_TIMEOUT_SECONDS = 10;

    public function __construct(
        public ?string $baseUrl,
        public ?string $bearerToken = null,
        public int $timeoutSeconds = self::DEFAULT_TIMEOUT_SECONDS,
        public ?float $searchAlpha = null,
        public bool $strict = false,
    ) {
    }

    public static function fromEnvironment(): self
    {
        return new self(
            baseUrl: self::readEnv('NENE_RECALL_BASE_URL'),
            bearerToken: self::readEnv('NENE_RECALL_BEARER_TOKEN'),
            timeoutSeconds: self::readTimeoutSeconds(),
            searchAlpha: self::readSearchAlpha(),
            strict: self::readEnv('NENE_RECALL_STRICT') === '1',
        );
    }

    public function isConfigured(): bool
    {
        return $this->baseUrl !== null && $this->baseUrl !== '';
    }

    /**
     * Base URL without a trailing slash, so callers can concatenate paths.
     */
    public function endpoint(string $path): string
    {
        return rtrim((string) $this->baseUrl, '/') . $path;
    }

    private static function readTimeoutSeconds(): int
    {
        $raw = self::readEnv('NENE_RECALL_TIMEOUT_SECONDS');

        if ($raw === null || !ctype_digit($raw)) {
            return self::DEFAULT_TIMEOUT_SECONDS;
        }

        $seconds = (int) $raw;

        // A zero timeout means "wait forever" in curl, which would hang ingestion
        // on an unresponsive Recall. Treat it as "not configured" instead.
        return $seconds > 0 ? $seconds : self::DEFAULT_TIMEOUT_SECONDS;
    }

    private static function readSearchAlpha(): ?float
    {
        $raw = self::readEnv('NENE_RECALL_SEARCH_ALPHA');

        if ($raw === null || !is_numeric($raw)) {
            return null;
        }

        $alpha = (float) $raw;

        // Out-of-range values are dropped rather than clamped: sending them would
        // make Recall answer 400 and take the whole search down with it.
        return ($alpha >= 0.0 && $alpha <= 1.0) ? $alpha : null;
    }

    private static function readEnv(string $key): ?string
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? null;

        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed !== '' ? $trimmed : null;
    }
}
