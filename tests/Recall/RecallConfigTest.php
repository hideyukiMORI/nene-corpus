<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Recall;

use NeneCorpus\Recall\RecallConfig;
use PHPUnit\Framework\TestCase;

final class RecallConfigTest extends TestCase
{
    /** @var array<string, string|null> */
    private array $saved = [];

    private const KEYS = [
        'NENE_RECALL_BASE_URL',
        'NENE_RECALL_BEARER_TOKEN',
        'NENE_RECALL_TIMEOUT_SECONDS',
        'NENE_RECALL_SEARCH_ALPHA',
        'NENE_RECALL_STRICT',
    ];

    protected function setUp(): void
    {
        foreach (self::KEYS as $key) {
            $value = $_ENV[$key] ?? null;
            $this->saved[$key] = is_string($value) ? $value : null;
            unset($_ENV[$key], $_SERVER[$key]);
        }
    }

    protected function tearDown(): void
    {
        foreach (self::KEYS as $key) {
            unset($_ENV[$key], $_SERVER[$key]);

            if ($this->saved[$key] !== null) {
                $_ENV[$key] = $this->saved[$key];
            }
        }
    }

    public function test_is_not_configured_without_a_base_url(): void
    {
        self::assertFalse(RecallConfig::fromEnvironment()->isConfigured());
    }

    public function test_blank_base_url_is_not_configured(): void
    {
        $_ENV['NENE_RECALL_BASE_URL'] = '   ';

        self::assertFalse(RecallConfig::fromEnvironment()->isConfigured());
    }

    public function test_reads_every_setting(): void
    {
        $_ENV['NENE_RECALL_BASE_URL'] = 'http://127.0.0.1:8080';
        $_ENV['NENE_RECALL_BEARER_TOKEN'] = 'devtoken';
        $_ENV['NENE_RECALL_TIMEOUT_SECONDS'] = '3';
        $_ENV['NENE_RECALL_SEARCH_ALPHA'] = '0.8';
        $_ENV['NENE_RECALL_STRICT'] = '1';

        $config = RecallConfig::fromEnvironment();

        self::assertTrue($config->isConfigured());
        self::assertSame('devtoken', $config->bearerToken);
        self::assertSame(3, $config->timeoutSeconds);
        self::assertSame(0.8, $config->searchAlpha);
        self::assertTrue($config->strict);
        self::assertSame('http://127.0.0.1:8080/v1/search', $config->endpoint('/v1/search'));
    }

    public function test_trailing_slash_does_not_double_up(): void
    {
        $config = new RecallConfig(baseUrl: 'http://127.0.0.1:8080/');

        self::assertSame('http://127.0.0.1:8080/v1/chunks', $config->endpoint('/v1/chunks'));
    }

    public function test_zero_timeout_falls_back_to_the_default(): void
    {
        $_ENV['NENE_RECALL_BASE_URL'] = 'http://127.0.0.1:8080';
        $_ENV['NENE_RECALL_TIMEOUT_SECONDS'] = '0';

        // curl reads 0 as "wait forever", which would hang ingestion.
        self::assertSame(RecallConfig::DEFAULT_TIMEOUT_SECONDS, RecallConfig::fromEnvironment()->timeoutSeconds);
    }

    public function test_out_of_range_alpha_is_dropped(): void
    {
        $_ENV['NENE_RECALL_BASE_URL'] = 'http://127.0.0.1:8080';
        $_ENV['NENE_RECALL_SEARCH_ALPHA'] = '1.4';

        // Sending it would make Recall answer 400 and take search down with it.
        self::assertNull(RecallConfig::fromEnvironment()->searchAlpha);
    }

    public function test_strict_defaults_to_off(): void
    {
        $_ENV['NENE_RECALL_BASE_URL'] = 'http://127.0.0.1:8080';

        self::assertFalse(RecallConfig::fromEnvironment()->strict);
    }
}
