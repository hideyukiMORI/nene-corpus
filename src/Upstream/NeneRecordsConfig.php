<?php

declare(strict_types=1);

namespace NeneCorpus\Upstream;

final readonly class NeneRecordsConfig
{
    public function __construct(
        public ?string $baseUrl,
        public ?string $bearerToken,
    ) {
    }

    public static function fromEnvironment(): self
    {
        return new self(
            baseUrl: self::readEnv('NENE_RECORDS_API_BASE_URL'),
            bearerToken: self::readEnv('NENE_RECORDS_BEARER_TOKEN'),
        );
    }

    public function isConfigured(): bool
    {
        return $this->baseUrl !== null && $this->baseUrl !== '';
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
