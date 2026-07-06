<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Notification;

use NeneCorpus\Mail\MailerInterface;
use NeneCorpus\Mail\MailMessage;
use NeneCorpus\Notification\DailyReportRepositoryInterface;
use NeneCorpus\Notification\DailyReportStats;
use NeneCorpus\Notification\NotificationException;
use NeneCorpus\Notification\SendDailyReportUseCase;
use NeneCorpus\Tests\Support\FixedClock;
use PHPUnit\Framework\TestCase;

final class SendDailyReportUseCaseTest extends TestCase
{
    private function makeStats(string $date = '2026-01-15'): DailyReportStats
    {
        return new DailyReportStats(
            reportDate: $date,
            totalSessions: 10,
            totalMessages: 42,
            uniqueIps: 7,
            rateLimitHits: 3,
        );
    }

    public function test_throws_when_smtp_not_configured(): void
    {
        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(false);

        $repo = $this->createStub(DailyReportRepositoryInterface::class);

        $this->expectException(NotificationException::class);
        $this->expectExceptionMessage('SMTP is not configured');

        (new SendDailyReportUseCase($mailer, $repo, new FixedClock()))->execute('to@example.com', '2026-01-15');
    }

    public function test_sends_mail_and_returns_stats(): void
    {
        $stats = $this->makeStats('2026-01-15');

        $repo = $this->createStub(DailyReportRepositoryInterface::class);
        $repo->method('getStats')->willReturn($stats);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(true);
        $mailer->expects(self::once())->method('send');

        $result = (new SendDailyReportUseCase($mailer, $repo, new FixedClock()))->execute('ops@example.com', '2026-01-15');

        self::assertSame($stats, $result);
    }

    public function test_mail_sent_to_correct_recipient(): void
    {
        $repo = $this->createStub(DailyReportRepositoryInterface::class);
        $repo->method('getStats')->willReturn($this->makeStats());

        $capturedMessage = null;
        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(true);
        $mailer->method('send')->willReturnCallback(
            static function (MailMessage $msg) use (&$capturedMessage): void {
                $capturedMessage = $msg;
            },
        );

        (new SendDailyReportUseCase($mailer, $repo, new FixedClock()))->execute('report@example.com', '2026-01-15');

        self::assertNotNull($capturedMessage);
        self::assertSame('report@example.com', $capturedMessage->to);
    }

    public function test_mail_subject_contains_date(): void
    {
        $repo = $this->createStub(DailyReportRepositoryInterface::class);
        $repo->method('getStats')->willReturn($this->makeStats('2026-01-15'));

        $capturedMessage = null;
        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(true);
        $mailer->method('send')->willReturnCallback(
            static function (MailMessage $msg) use (&$capturedMessage): void {
                $capturedMessage = $msg;
            },
        );

        (new SendDailyReportUseCase($mailer, $repo, new FixedClock()))->execute('to@example.com', '2026-01-15');

        self::assertNotNull($capturedMessage);
        self::assertStringContainsString('2026-01-15', $capturedMessage->subject);
    }

    public function test_mail_html_body_contains_stats(): void
    {
        $repo = $this->createStub(DailyReportRepositoryInterface::class);
        $repo->method('getStats')->willReturn($this->makeStats('2026-01-15'));

        $capturedMessage = null;
        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(true);
        $mailer->method('send')->willReturnCallback(
            static function (MailMessage $msg) use (&$capturedMessage): void {
                $capturedMessage = $msg;
            },
        );

        (new SendDailyReportUseCase($mailer, $repo, new FixedClock()))->execute('to@example.com', '2026-01-15');

        self::assertNotNull($capturedMessage);
        // Stats values should appear in the HTML body
        self::assertStringContainsString('10', $capturedMessage->htmlBody);  // totalSessions
        self::assertStringContainsString('42', $capturedMessage->htmlBody);  // totalMessages
        self::assertStringContainsString('7', $capturedMessage->htmlBody);   // uniqueIps
        self::assertStringContainsString('3', $capturedMessage->htmlBody);   // rateLimitHits
    }

    public function test_date_passed_to_repository(): void
    {
        $capturedDate = null;
        $repo = $this->createStub(DailyReportRepositoryInterface::class);
        $repo->method('getStats')->willReturnCallback(
            static function (string $date) use (&$capturedDate): DailyReportStats {
                $capturedDate = $date;
                return new DailyReportStats($date, 0, 0, 0, 0);
            },
        );

        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(true);

        (new SendDailyReportUseCase($mailer, $repo, new FixedClock()))->execute('to@example.com', '2025-12-31');

        self::assertSame('2025-12-31', $capturedDate);
    }

    public function test_uses_today_when_date_not_specified(): void
    {
        $today = '2026-01-15'; // 固定時計の日付に一致
        $capturedDate = null;

        $repo = $this->createStub(DailyReportRepositoryInterface::class);
        $repo->method('getStats')->willReturnCallback(
            static function (string $date) use (&$capturedDate): DailyReportStats {
                $capturedDate = $date;
                return new DailyReportStats($date, 0, 0, 0, 0);
            },
        );

        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(true);

        (new SendDailyReportUseCase($mailer, $repo, new FixedClock()))->execute('to@example.com');

        self::assertSame($today, $capturedDate);
    }
}
