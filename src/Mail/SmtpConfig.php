<?php

declare(strict_types=1);

namespace NeneCorpus\Mail;

final readonly class SmtpConfig
{
    public function __construct(
        public string $host,
        public int $port,
        public string $username,
        public string $password,
        public string $encryption, // 'tls' | 'ssl' | 'none'
        public string $fromAddress,
        public string $fromName,
    ) {
    }

    public static function fromEnvironment(): ?self
    {
        $host = (string) ($_ENV['MAIL_HOST'] ?? getenv('MAIL_HOST') ?: '');

        if ($host === '') {
            return null;
        }

        $port        = (int) ($_ENV['MAIL_PORT'] ?? getenv('MAIL_PORT') ?: 587);
        $username    = (string) ($_ENV['MAIL_USERNAME'] ?? getenv('MAIL_USERNAME') ?: '');
        $password    = (string) ($_ENV['MAIL_PASSWORD'] ?? getenv('MAIL_PASSWORD') ?: '');
        $encryption  = (string) ($_ENV['MAIL_ENCRYPTION'] ?? getenv('MAIL_ENCRYPTION') ?: 'tls');
        $fromAddress = (string) ($_ENV['MAIL_FROM_ADDRESS'] ?? getenv('MAIL_FROM_ADDRESS') ?: $username);
        $fromName    = (string) ($_ENV['MAIL_FROM_NAME'] ?? getenv('MAIL_FROM_NAME') ?: 'NeNe Corpus');

        return new self(
            host: $host,
            port: $port,
            username: $username,
            password: $password,
            encryption: $encryption,
            fromAddress: $fromAddress,
            fromName: $fromName,
        );
    }
}
