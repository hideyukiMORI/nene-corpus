<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Notification;

use NeneCorpus\Notification\GetNotificationSettingsUseCase;
use PHPUnit\Framework\TestCase;

final class GetNotificationSettingsUseCaseTest extends TestCase
{
    /** @var array<string, string|false> */
    private array $envBackup = [];

    private const ENV_KEYS = [
        'MAIL_HOST', 'MAIL_PORT', 'MAIL_USERNAME', 'MAIL_PASSWORD',
        'MAIL_ENCRYPTION', 'MAIL_FROM_ADDRESS', 'MAIL_FROM_NAME',
        'NOTIFY_EMAIL', 'NOTIFY_RATE_LIMIT_ENABLED',
        'NOTIFY_RATE_LIMIT_COOLDOWN_MINUTES', 'NOTIFY_DAILY_REPORT_ENABLED',
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

    public function test_returns_smtp_not_configured_when_no_mail_host(): void
    {
        $view = (new GetNotificationSettingsUseCase())->execute();

        self::assertFalse($view->smtpConfigured);
        self::assertFalse($view->smtpPasswordSet);
        self::assertSame('', $view->smtpHost);
        self::assertSame(587, $view->smtpPort);
        self::assertSame('tls', $view->smtpEncryption);
    }

    public function test_returns_smtp_configured_when_mail_host_set(): void
    {
        $_ENV['MAIL_HOST'] = 'smtp.example.com';
        $_ENV['MAIL_PORT'] = '465';
        $_ENV['MAIL_USERNAME'] = 'user@example.com';
        $_ENV['MAIL_PASSWORD'] = 'secret';
        $_ENV['MAIL_ENCRYPTION'] = 'ssl';
        $_ENV['MAIL_FROM_ADDRESS'] = 'noreply@example.com';
        $_ENV['MAIL_FROM_NAME'] = 'My App';

        $view = (new GetNotificationSettingsUseCase())->execute();

        self::assertTrue($view->smtpConfigured);
        self::assertSame('smtp.example.com', $view->smtpHost);
        self::assertSame(465, $view->smtpPort);
        self::assertSame('user@example.com', $view->smtpUsername);
        self::assertTrue($view->smtpPasswordSet);
        self::assertSame('ssl', $view->smtpEncryption);
        self::assertSame('noreply@example.com', $view->smtpFromAddress);
        self::assertSame('My App', $view->smtpFromName);
    }

    public function test_smtp_password_set_false_when_empty(): void
    {
        $_ENV['MAIL_HOST'] = 'smtp.example.com';
        $_ENV['MAIL_PASSWORD'] = '';

        $view = (new GetNotificationSettingsUseCase())->execute();

        self::assertFalse($view->smtpPasswordSet);
    }

    public function test_password_not_exposed_in_view(): void
    {
        $_ENV['MAIL_HOST'] = 'smtp.example.com';
        $_ENV['MAIL_PASSWORD'] = 'topsecret';

        $view = (new GetNotificationSettingsUseCase())->execute();

        // View has smtpPasswordSet flag but never exposes the raw password
        self::assertTrue($view->smtpPasswordSet);
        $arr = $view->toArray();
        self::assertArrayNotHasKey('smtp_password', $arr);
        self::assertArrayHasKey('smtp_password_set', $arr);
    }

    public function test_notification_config_fields_reflected(): void
    {
        $_ENV['NOTIFY_EMAIL']                       = 'ops@example.com';
        $_ENV['NOTIFY_RATE_LIMIT_ENABLED']          = 'true';
        $_ENV['NOTIFY_RATE_LIMIT_COOLDOWN_MINUTES'] = '20';
        $_ENV['NOTIFY_DAILY_REPORT_ENABLED']        = 'true';
        $_ENV['NOTIFY_DAILY_REPORT_TOKEN']          = 'tok-abc';

        $view = (new GetNotificationSettingsUseCase())->execute();

        self::assertSame('ops@example.com', $view->notifyEmail);
        self::assertTrue($view->rateLimitNotifyEnabled);
        self::assertSame(20, $view->rateLimitCooldownMinutes);
        self::assertTrue($view->dailyReportEnabled);
        self::assertSame('tok-abc', $view->dailyReportToken);
    }

    public function test_to_array_contains_expected_keys(): void
    {
        $view = (new GetNotificationSettingsUseCase())->execute();
        $arr  = $view->toArray();

        self::assertArrayHasKey('smtp_host', $arr);
        self::assertArrayHasKey('smtp_configured', $arr);
        self::assertArrayHasKey('notify_email', $arr);
        self::assertArrayHasKey('rate_limit_notify_enabled', $arr);
        self::assertArrayHasKey('daily_report_enabled', $arr);
        self::assertArrayHasKey('daily_report_token', $arr);
    }
}
