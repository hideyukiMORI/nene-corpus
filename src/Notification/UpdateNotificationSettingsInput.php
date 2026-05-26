<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

final readonly class UpdateNotificationSettingsInput
{
    public function __construct(
        public string $smtpHost,
        public int $smtpPort,
        public string $smtpUsername,
        public ?string $smtpPassword, // null = keep existing
        public string $smtpEncryption,
        public string $smtpFromAddress,
        public string $smtpFromName,
        public string $notifyEmail,
        public bool $rateLimitNotifyEnabled,
        public int $rateLimitCooldownMinutes,
        public bool $dailyReportEnabled,
        public bool $regenerateDailyReportToken,
    ) {
    }
}
