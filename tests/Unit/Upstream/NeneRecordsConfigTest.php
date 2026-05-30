<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Unit\Upstream;

use NeneCorpus\Upstream\NeneRecordsConfig;
use PHPUnit\Framework\TestCase;

final class NeneRecordsConfigTest extends TestCase
{
    public function test_not_configured_when_base_url_absent(): void
    {
        $config = new NeneRecordsConfig(baseUrl: null, bearerToken: null);
        self::assertFalse($config->isConfigured());
    }

    public function test_not_configured_when_base_url_empty(): void
    {
        $config = new NeneRecordsConfig(baseUrl: '', bearerToken: null);
        self::assertFalse($config->isConfigured());
    }

    public function test_configured_when_base_url_present(): void
    {
        $config = new NeneRecordsConfig(baseUrl: 'http://records.example.com', bearerToken: null);
        self::assertTrue($config->isConfigured());
    }

    public function test_configured_with_bearer_token(): void
    {
        $config = new NeneRecordsConfig(baseUrl: 'http://records.example.com', bearerToken: 'token-abc');
        self::assertTrue($config->isConfigured());
        self::assertSame('token-abc', $config->bearerToken);
    }

    public function test_from_environment_trims_whitespace(): void
    {
        $_ENV['NENE_RECORDS_API_BASE_URL'] = '  http://example.com  ';
        $_ENV['NENE_RECORDS_BEARER_TOKEN'] = '  tok  ';

        $config = NeneRecordsConfig::fromEnvironment();

        self::assertSame('http://example.com', $config->baseUrl);
        self::assertSame('tok', $config->bearerToken);

        unset($_ENV['NENE_RECORDS_API_BASE_URL'], $_ENV['NENE_RECORDS_BEARER_TOKEN']);
    }

    public function test_from_environment_returns_null_for_empty_string(): void
    {
        $_ENV['NENE_RECORDS_API_BASE_URL'] = '';
        $_ENV['NENE_RECORDS_BEARER_TOKEN'] = '';

        $config = NeneRecordsConfig::fromEnvironment();

        self::assertNull($config->baseUrl);
        self::assertNull($config->bearerToken);
        self::assertFalse($config->isConfigured());

        unset($_ENV['NENE_RECORDS_API_BASE_URL'], $_ENV['NENE_RECORDS_BEARER_TOKEN']);
    }
}
