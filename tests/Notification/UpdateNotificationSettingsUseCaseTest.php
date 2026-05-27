<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Notification;

use NeneCorpus\Config\EnvironmentVariableUpdater;
use NeneCorpus\Install\EnvFileWriter;
use NeneCorpus\Notification\GetNotificationSettingsUseCase;
use NeneCorpus\Notification\UpdateNotificationSettingsInput;
use NeneCorpus\Notification\UpdateNotificationSettingsUseCase;
use PHPUnit\Framework\TestCase;

final class UpdateNotificationSettingsUseCaseTest extends TestCase
{
    private string $tmpDir = '';

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
        // Backup and clear env vars
        foreach (self::ENV_KEYS as $key) {
            $this->envBackup[$key] = $_ENV[$key] ?? false;
            unset($_ENV[$key]);
            putenv($key);
        }

        // Create temp dir with a minimal .env.example
        $this->tmpDir = sys_get_temp_dir() . '/nene_test_' . uniqid('', true);
        mkdir($this->tmpDir, 0700, true);

        $envExample = implode("\n", [
            'MAIL_HOST=',
            'MAIL_PORT=587',
            'MAIL_USERNAME=',
            'MAIL_PASSWORD=',
            'MAIL_ENCRYPTION=tls',
            'MAIL_FROM_ADDRESS=',
            'MAIL_FROM_NAME=NeNe Corpus',
            'NOTIFY_EMAIL=',
            'NOTIFY_RATE_LIMIT_ENABLED=false',
            'NOTIFY_RATE_LIMIT_COOLDOWN_MINUTES=60',
            'NOTIFY_DAILY_REPORT_ENABLED=false',
            'NOTIFY_DAILY_REPORT_TOKEN=',
        ]) . "\n";

        file_put_contents($this->tmpDir . '/.env.example', $envExample);
    }

    protected function tearDown(): void
    {
        // Restore env vars
        foreach ($this->envBackup as $key => $value) {
            if ($value === false) {
                unset($_ENV[$key]);
                putenv($key);
            } else {
                $_ENV[$key] = $value;
                putenv("{$key}={$value}");
            }
        }

        // Remove temp files
        if (is_file($this->tmpDir . '/.env')) {
            unlink($this->tmpDir . '/.env');
        }
        if (is_file($this->tmpDir . '/.env.example')) {
            unlink($this->tmpDir . '/.env.example');
        }
        if (is_dir($this->tmpDir)) {
            rmdir($this->tmpDir);
        }
    }

    private function makeUseCase(): UpdateNotificationSettingsUseCase
    {
        return new UpdateNotificationSettingsUseCase(
            new EnvFileWriter($this->tmpDir),
            new EnvironmentVariableUpdater(),
            new GetNotificationSettingsUseCase(),
        );
    }

    /** @param array<string, mixed> $overrides */
    private function makeInput(array $overrides = []): UpdateNotificationSettingsInput
    {
        return new UpdateNotificationSettingsInput(
            smtpHost:                   $overrides['smtpHost'] ?? 'smtp.example.com',
            smtpPort:                   $overrides['smtpPort'] ?? 587,
            smtpUsername:               $overrides['smtpUsername'] ?? 'user@example.com',
            smtpPassword:               $overrides['smtpPassword'] ?? 'newpass',
            smtpEncryption:             $overrides['smtpEncryption'] ?? 'tls',
            smtpFromAddress:            $overrides['smtpFromAddress'] ?? 'from@example.com',
            smtpFromName:               $overrides['smtpFromName'] ?? 'NeNe Corpus',
            notifyEmail:                $overrides['notifyEmail'] ?? 'ops@example.com',
            rateLimitNotifyEnabled:     $overrides['rateLimitNotifyEnabled'] ?? false,
            rateLimitCooldownMinutes:   $overrides['rateLimitCooldownMinutes'] ?? 60,
            dailyReportEnabled:         $overrides['dailyReportEnabled'] ?? false,
            regenerateDailyReportToken: $overrides['regenerateDailyReportToken'] ?? false,
        );
    }

    public function test_returns_view_with_updated_smtp_settings(): void
    {
        $view = $this->makeUseCase()->execute($this->makeInput([
            'smtpHost' => 'mail.corp.com',
            'smtpPort' => 465,
        ]));

        self::assertTrue($view->smtpConfigured);
        self::assertSame('mail.corp.com', $view->smtpHost);
        self::assertSame(465, $view->smtpPort);
    }

    public function test_keeps_existing_password_when_smtp_password_null(): void
    {
        // Seed an existing password in env
        $_ENV['MAIL_HOST']     = 'smtp.example.com';
        $_ENV['MAIL_PASSWORD'] = 'existingpass';

        $view = $this->makeUseCase()->execute($this->makeInput([
            'smtpPassword' => null, // keep existing
        ]));

        // The view should show password is still set
        self::assertTrue($view->smtpPasswordSet);
    }

    public function test_uses_new_password_when_provided(): void
    {
        $_ENV['MAIL_HOST']     = 'smtp.example.com';
        $_ENV['MAIL_PASSWORD'] = 'oldpass';

        $this->makeUseCase()->execute($this->makeInput([
            'smtpPassword' => 'brandnewpass',
        ]));

        // After execute, env should have the new password
        self::assertSame('brandnewpass', (string) $_ENV['MAIL_PASSWORD']);
    }

    public function test_regenerates_daily_report_token_when_requested(): void
    {
        $_ENV['NOTIFY_DAILY_REPORT_TOKEN'] = 'old-token';

        $view = $this->makeUseCase()->execute($this->makeInput([
            'regenerateDailyReportToken' => true,
        ]));

        self::assertNotSame('old-token', $view->dailyReportToken);
        self::assertNotEmpty($view->dailyReportToken);
    }

    public function test_keeps_existing_token_when_regenerate_false_and_token_exists(): void
    {
        $_ENV['NOTIFY_DAILY_REPORT_TOKEN'] = 'keep-this-token';

        $view = $this->makeUseCase()->execute($this->makeInput([
            'regenerateDailyReportToken' => false,
        ]));

        self::assertSame('keep-this-token', $view->dailyReportToken);
    }

    public function test_generates_new_token_when_current_token_empty(): void
    {
        $_ENV['NOTIFY_DAILY_REPORT_TOKEN'] = '';

        $view = $this->makeUseCase()->execute($this->makeInput([
            'regenerateDailyReportToken' => false,
        ]));

        self::assertNotEmpty($view->dailyReportToken);
    }

    public function test_generated_token_is_48_char_hex(): void
    {
        $view = $this->makeUseCase()->execute($this->makeInput([
            'regenerateDailyReportToken' => true,
        ]));

        self::assertMatchesRegularExpression('/^[0-9a-f]{48}$/', $view->dailyReportToken);
    }

    public function test_writes_env_file(): void
    {
        $this->makeUseCase()->execute($this->makeInput([
            'smtpHost' => 'test.smtp.local',
        ]));

        $envContent = file_get_contents($this->tmpDir . '/.env');
        self::assertIsString($envContent);
        self::assertStringContainsString('MAIL_HOST=test.smtp.local', $envContent);
    }

    public function test_updates_notification_settings(): void
    {
        $view = $this->makeUseCase()->execute($this->makeInput([
            'notifyEmail'             => 'alert@example.com',
            'rateLimitNotifyEnabled'  => true,
            'rateLimitCooldownMinutes' => 30,
            'dailyReportEnabled'      => true,
        ]));

        self::assertSame('alert@example.com', $view->notifyEmail);
        self::assertTrue($view->rateLimitNotifyEnabled);
        self::assertSame(30, $view->rateLimitCooldownMinutes);
        self::assertTrue($view->dailyReportEnabled);
    }
}
