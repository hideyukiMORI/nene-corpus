<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Notification;

use NeneCorpus\Mail\MailerInterface;
use NeneCorpus\Mail\MailMessage;
use NeneCorpus\Notification\NotificationException;
use NeneCorpus\Notification\SendTestMailUseCase;
use PHPUnit\Framework\TestCase;

final class SendTestMailUseCaseTest extends TestCase
{
    public function test_throws_when_smtp_not_configured(): void
    {
        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(false);

        $this->expectException(NotificationException::class);
        $this->expectExceptionMessage('SMTP is not configured');

        (new SendTestMailUseCase($mailer))->execute('to@example.com');
    }

    public function test_sends_mail_when_configured(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(true);
        $mailer->expects(self::once())
            ->method('send')
            ->with(self::callback(static function (MailMessage $msg): bool {
                return $msg->to === 'to@example.com'
                    && str_contains($msg->subject, 'テスト送信');
            }));

        (new SendTestMailUseCase($mailer))->execute('to@example.com');
    }

    public function test_mail_contains_html_and_text_body(): void
    {
        $capturedMessage = null;

        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(true);
        $mailer->method('send')->willReturnCallback(
            static function (MailMessage $msg) use (&$capturedMessage): void {
                $capturedMessage = $msg;
            },
        );

        (new SendTestMailUseCase($mailer))->execute('recipient@example.com');

        self::assertNotNull($capturedMessage);
        self::assertNotEmpty($capturedMessage->textBody);
        self::assertNotEmpty($capturedMessage->htmlBody);
        self::assertSame('recipient@example.com', $capturedMessage->to);
    }
}
