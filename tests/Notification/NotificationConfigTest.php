<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Notification;

use NeneCorpus\Notification\NotificationConfig;
use PHPUnit\Framework\TestCase;

final class NotificationConfigTest extends TestCase
{
    /** @var array<string, string|false> */
    private array $envBackup = [];

    private const ENV_KEYS = [
        'NOTIFY_EMAIL',
        'NOTIFY_RATE_LIMIT_ENABLED',
        'NOTIFY_RATE_LIMIT_COOLDOWN_MINUTES',
        'NOTIFY_DAILY_REPORT_ENABLED',
        'NOTIFY_DAILY_REPORT_TOKEN',
    ];

    protected function setUp(): void
    {
        foreach (self::ENV_KEYS as $key) {
            $this->envBackup[$key] = $_ENV[$key] ?? false;
            unset($_ENV[$key]);
            putenv($key);
        }
    }

    protected function tearDown(): void
    {
        foreach ($this->envBackup as $key => $value) {
            if ($value === false) {
                unset($_ENV[$key]);
                putenv($key);
            } else {
                $_ENV[$key] = $value;
                putenv("{$key}={$value}");
            }
        }
    }

    public function test_defaults_when_no_env_vars_set(): void
    {
        $config = NotificationConfig::fromEnvironment();

        self::assertSame('', $config->notifyEmail);
        self::assertFalse($config->rateLimitNotifyEnabled);
        self::assertSame(60, $config->rateLimitCooldownMinutes);
        self::assertFalse($config->dailyReportEnabled);
        self::assertSame('', $config->dailyReportToken);
    }

    public function test_notify_email_from_env(): void
    {
        $_ENV['NOTIFY_EMAIL'] = 'admin@example.com';

        $config = NotificationConfig::fromEnvironment();

        self::assertSame('admin@example.com', $config->notifyEmail);
    }

    public function test_rate_limit_notify_enabled_true(): void
    {
        $_ENV['NOTIFY_RATE_LIMIT_ENABLED'] = 'true';

        $config = NotificationConfig::fromEnvironment();

        self::assertTrue($config->rateLimitNotifyEnabled);
    }

    public function test_rate_limit_notify_enabled_false_string(): void
    {
        $_ENV['NOTIFY_RATE_LIMIT_ENABLED'] = 'false';

        $config = NotificationConfig::fromEnvironment();

        self::assertFalse($config->rateLimitNotifyEnabled);
    }

    public function test_cooldown_minutes_from_env(): void
    {
        $_ENV['NOTIFY_RATE_LIMIT_COOLDOWN_MINUTES'] = '30';

        $config = NotificationConfig::fromEnvironment();

        self::assertSame(30, $config->rateLimitCooldownMinutes);
    }

    public function test_cooldown_minutes_falls_back_to_default_when_zero_string(): void
    {
        // PHP の `?: 60` 演算子では '0' が偽値のためデフォルト (60) にフォールバックする
        $_ENV['NOTIFY_RATE_LIMIT_COOLDOWN_MINUTES'] = '0';

        $config = NotificationConfig::fromEnvironment();

        self::assertSame(60, $config->rateLimitCooldownMinutes);
    }

    public function test_cooldown_minutes_clamped_to_min_1_when_negative(): void
    {
        $_ENV['NOTIFY_RATE_LIMIT_COOLDOWN_MINUTES'] = '-10';

        $config = NotificationConfig::fromEnvironment();

        self::assertSame(1, $config->rateLimitCooldownMinutes);
    }

    public function test_daily_report_enabled_true(): void
    {
        $_ENV['NOTIFY_DAILY_REPORT_ENABLED'] = 'true';

        $config = NotificationConfig::fromEnvironment();

        self::assertTrue($config->dailyReportEnabled);
    }

    public function test_daily_report_token_from_env(): void
    {
        $_ENV['NOTIFY_DAILY_REPORT_TOKEN'] = 'my-secret-token-abc123';

        $config = NotificationConfig::fromEnvironment();

        self::assertSame('my-secret-token-abc123', $config->dailyReportToken);
    }

    public function test_all_fields_populated_together(): void
    {
        $_ENV['NOTIFY_EMAIL']                        = 'ops@example.com';
        $_ENV['NOTIFY_RATE_LIMIT_ENABLED']           = 'true';
        $_ENV['NOTIFY_RATE_LIMIT_COOLDOWN_MINUTES']  = '15';
        $_ENV['NOTIFY_DAILY_REPORT_ENABLED']         = 'true';
        $_ENV['NOTIFY_DAILY_REPORT_TOKEN']           = 'tok123';

        $config = NotificationConfig::fromEnvironment();

        self::assertSame('ops@example.com', $config->notifyEmail);
        self::assertTrue($config->rateLimitNotifyEnabled);
        self::assertSame(15, $config->rateLimitCooldownMinutes);
        self::assertTrue($config->dailyReportEnabled);
        self::assertSame('tok123', $config->dailyReportToken);
    }
}
