<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

final readonly class AnthropicConfig
{
    private const DEFAULT_MODEL = 'claude-3-5-haiku-20241022';

    private const DEFAULT_MAX_TOKENS = 1024;

    public function __construct(
        public ?string $apiKey,
        public string $model = self::DEFAULT_MODEL,
        public int $maxTokens = self::DEFAULT_MAX_TOKENS,
    ) {
    }

    public static function fromEnvironment(): self
    {
        $apiKey = self::readEnv('ANTHROPIC_API_KEY');
        $model = self::readEnv('ANTHROPIC_MODEL') ?? self::DEFAULT_MODEL;
        $maxTokensRaw = self::readEnv('ANTHROPIC_MAX_TOKENS');
        $maxTokens = $maxTokensRaw !== null && $maxTokensRaw !== ''
            ? max(1, (int) $maxTokensRaw)
            : self::DEFAULT_MAX_TOKENS;

        return new self(
            apiKey: $apiKey !== '' ? $apiKey : null,
            model: $model,
            maxTokens: $maxTokens,
        );
    }

    public function isConfigured(): bool
    {
        return $this->apiKey !== null && $this->apiKey !== '';
    }

    private static function readEnv(string $key): ?string
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? null;

        if (!is_string($value)) {
            return null;
        }

        return trim($value);
    }
}
