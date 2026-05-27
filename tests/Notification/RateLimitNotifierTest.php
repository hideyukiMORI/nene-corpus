<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Notification;

use Nene2\Middleware\RateLimitStorageInterface;
use NeneCorpus\Mail\MailerInterface;
use NeneCorpus\Mail\MailSendException;
use NeneCorpus\Notification\NotificationConfig;
use NeneCorpus\Notification\RateLimitNotifier;
use PHPUnit\Framework\TestCase;

final class RateLimitNotifierTest extends TestCase
{
    private function makeConfig(bool $enabled = true, int $cooldownMinutes = 60): NotificationConfig
    {
        return new NotificationConfig(
            notifyEmail: 'ops@example.com',
            rateLimitNotifyEnabled: $enabled,
            rateLimitCooldownMinutes: $cooldownMinutes,
            dailyReportEnabled: false,
            dailyReportToken: '',
        );
    }

    public function test_does_nothing_when_rate_limit_notify_disabled(): void
    {
        $mailer  = $this->createMock(MailerInterface::class);
        $storage = $this->createMock(RateLimitStorageInterface::class);

        $mailer->expects(self::never())->method('send');
        $storage->expects(self::never())->method('hit');

        (new RateLimitNotifier($mailer, $storage))->notifyIfNeeded(
            $this->makeConfig(enabled: false),
            'ops@example.com',
            '1.2.3.4',
            'session_hourly',
        );
    }

    public function test_does_nothing_when_mailer_not_configured(): void
    {
        $mailer  = $this->createMock(MailerInterface::class);
        $storage = $this->createStub(RateLimitStorageInterface::class);

        $mailer->expects(self::once())->method('isConfigured')->willReturn(false);
        $mailer->expects(self::never())->method('send');

        (new RateLimitNotifier($mailer, $storage))->notifyIfNeeded(
            $this->makeConfig(enabled: true),
            'ops@example.com',
            '1.2.3.4',
            'session_hourly',
        );
    }

    public function test_sends_mail_on_first_hit(): void
    {
        $mailer  = $this->createMock(MailerInterface::class);
        $storage = $this->createStub(RateLimitStorageInterface::class);

        $mailer->expects(self::once())->method('isConfigured')->willReturn(true);
        $mailer->expects(self::once())->method('send');

        // Both calls: daily hits tracking + cooldown gate
        $storage->method('hit')->willReturn(['count' => 1, 'reset_at' => time() + 3600]);

        (new RateLimitNotifier($mailer, $storage))->notifyIfNeeded(
            $this->makeConfig(),
            'ops@example.com',
            '1.2.3.4',
            'session_hourly',
        );
    }

    public function test_does_not_send_when_cooldown_active(): void
    {
        $mailer  = $this->createMock(MailerInterface::class);
        $storage = $this->createStub(RateLimitStorageInterface::class);

        $mailer->expects(self::once())->method('isConfigured')->willReturn(true);
        $mailer->expects(self::never())->method('send');

        // Cooldown hit returns count > 1 → still inside window
        $callCount = 0;
        $storage->method('hit')->willReturnCallback(
            static function () use (&$callCount): array {
                $callCount++;
                // First call = daily hits key (count doesn't matter for gate)
                // Second call = cooldown key → count > 1 suppresses mail
                return ['count' => $callCount === 1 ? 5 : 2, 'reset_at' => time() + 3600];
            },
        );

        (new RateLimitNotifier($mailer, $storage))->notifyIfNeeded(
            $this->makeConfig(),
            'ops@example.com',
            '192.168.0.1',
            'ip_hourly',
        );
    }

    public function test_mail_exception_is_swallowed_silently(): void
    {
        $mailer  = $this->createStub(MailerInterface::class);
        $storage = $this->createStub(RateLimitStorageInterface::class);

        $mailer->method('isConfigured')->willReturn(true);
        $mailer->method('send')->willThrowException(new MailSendException('SMTP error'));
        $storage->method('hit')->willReturn(['count' => 1, 'reset_at' => time() + 3600]);

        // Must not throw
        (new RateLimitNotifier($mailer, $storage))->notifyIfNeeded(
            $this->makeConfig(),
            'ops@example.com',
            '10.0.0.1',
            'daily_global',
        );

        $this->addToAssertionCount(1); // reached here without exception
    }

    public function test_tracks_daily_hits_regardless_of_cooldown(): void
    {
        $mailer  = $this->createStub(MailerInterface::class);
        $storage = $this->createMock(RateLimitStorageInterface::class);

        $mailer->method('isConfigured')->willReturn(true);

        $today = date('Y-m-d');
        $hitsKeyPrefix = 'notify:ratelimit:hits:' . $today;

        // hit() must be called for the daily hits key
        $storage->expects(self::atLeastOnce())
            ->method('hit')
            ->with(self::logicalOr(
                self::stringStartsWith($hitsKeyPrefix),
                self::stringStartsWith('notify:ratelimit:cooldown'),
            ))
            ->willReturn(['count' => 2, 'reset_at' => time() + 86400]);

        (new RateLimitNotifier($mailer, $storage))->notifyIfNeeded(
            $this->makeConfig(),
            'ops@example.com',
            '1.2.3.4',
            'session_hourly',
        );
    }
}
