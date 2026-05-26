<?php

declare(strict_types=1);

namespace NeneCorpus\Mail;

interface MailerInterface
{
    /**
     * @throws MailSendException
     */
    public function send(MailMessage $message): void;

    public function isConfigured(): bool;
}
