<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

final readonly class NotificationConfig
{
    public function __construct(
        /** Destination email for notifications (defaults to admin email if empty) */
        public string $notifyEmail,
        /** Fire an email when chat rate limit is exceeded */
        public bool $rateLimitNotifyEnabled,
        /** Minimum minutes between consecutive rate-limit notifications */
        public int $rateLimitCooldownMinutes,
        /** Send a daily chat summary email */
        public bool $dailyReportEnabled,
        /** Secret token required to trigger daily report via HTTP */
        public string $dailyReportToken,
    ) {
    }

    public static function fromEnvironment(): self
    {
        $rateLimitEnabled  = filter_var(
            $_ENV['NOTIFY_RATE_LIMIT_ENABLED'] ?? getenv('NOTIFY_RATE_LIMIT_ENABLED') ?: 'false',
            FILTER_VALIDATE_BOOLEAN,
        );
        $cooldown = (int) ($_ENV['NOTIFY_RATE_LIMIT_COOLDOWN_MINUTES'] ?? getenv('NOTIFY_RATE_LIMIT_COOLDOWN_MINUTES') ?: 60);
        $dailyEnabled = filter_var(
            $_ENV['NOTIFY_DAILY_REPORT_ENABLED'] ?? getenv('NOTIFY_DAILY_REPORT_ENABLED') ?: 'false',
            FILTER_VALIDATE_BOOLEAN,
        );

        return new self(
            notifyEmail: (string) ($_ENV['NOTIFY_EMAIL'] ?? getenv('NOTIFY_EMAIL') ?: ''),
            rateLimitNotifyEnabled: (bool) $rateLimitEnabled,
            rateLimitCooldownMinutes: max(1, $cooldown),
            dailyReportEnabled: (bool) $dailyEnabled,
            dailyReportToken: (string) ($_ENV['NOTIFY_DAILY_REPORT_TOKEN'] ?? getenv('NOTIFY_DAILY_REPORT_TOKEN') ?: ''),
        );
    }
}
