<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

final readonly class NotificationSettingsView
{
    public function __construct(
        // SMTP
        public string $smtpHost,
        public int $smtpPort,
        public string $smtpUsername,
        public bool $smtpPasswordSet,
        public string $smtpEncryption,
        public string $smtpFromAddress,
        public string $smtpFromName,
        public bool $smtpConfigured,
        // Destination
        public string $notifyEmail,
        // Rate limit notification
        public bool $rateLimitNotifyEnabled,
        public int $rateLimitCooldownMinutes,
        // Daily report
        public bool $dailyReportEnabled,
        public string $dailyReportToken,
    ) {
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'smtp_host'                       => $this->smtpHost,
            'smtp_port'                       => $this->smtpPort,
            'smtp_username'                   => $this->smtpUsername,
            'smtp_password_set'               => $this->smtpPasswordSet,
            'smtp_encryption'                 => $this->smtpEncryption,
            'smtp_from_address'               => $this->smtpFromAddress,
            'smtp_from_name'                  => $this->smtpFromName,
            'smtp_configured'                 => $this->smtpConfigured,
            'notify_email'                    => $this->notifyEmail,
            'rate_limit_notify_enabled'       => $this->rateLimitNotifyEnabled,
            'rate_limit_cooldown_minutes'     => $this->rateLimitCooldownMinutes,
            'daily_report_enabled'            => $this->dailyReportEnabled,
            'daily_report_token'              => $this->dailyReportToken,
        ];
    }
}
