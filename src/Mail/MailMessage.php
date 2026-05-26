<?php

declare(strict_types=1);

namespace NeneCorpus\Mail;

final readonly class MailMessage
{
    public function __construct(
        public string $to,
        public string $toName,
        public string $subject,
        public string $textBody,
        public string $htmlBody,
    ) {
    }
}
