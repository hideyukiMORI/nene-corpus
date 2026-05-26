<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use NeneCorpus\Mail\MailerInterface;
use NeneCorpus\Mail\MailMessage;
use NeneCorpus\Mail\MailSendException;

final readonly class SendTestMailUseCase
{
    public function __construct(
        private MailerInterface $mailer,
    ) {
    }

    /**
     * @throws MailSendException
     * @throws NotificationException
     */
    public function execute(string $toEmail): void
    {
        if (!$this->mailer->isConfigured()) {
            throw new NotificationException('SMTP is not configured.');
        }

        $this->mailer->send(new MailMessage(
            to: $toEmail,
            toName: '',
            subject: '[NeNe Corpus] テスト送信 / Test email',
            textBody: "NeNe Corpus からのテスト送信です。\nSMTP 設定が正常に動作しています。\n\nThis is a test email from NeNe Corpus.\nYour SMTP settings are working correctly.",
            htmlBody: '<p>NeNe Corpus からのテスト送信です。</p><p>SMTP 設定が正常に動作しています。</p><hr><p>This is a test email from NeNe Corpus.<br>Your SMTP settings are working correctly.</p>',
        ));
    }
}
