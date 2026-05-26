<?php

declare(strict_types=1);

namespace NeneCorpus\Mail;

/**
 * No-op mailer used when SMTP is not configured.
 */
final readonly class NullMailer implements MailerInterface
{
    public function send(MailMessage $message): void
    {
        // intentionally no-op
    }

    public function isConfigured(): bool
    {
        return false;
    }
}
