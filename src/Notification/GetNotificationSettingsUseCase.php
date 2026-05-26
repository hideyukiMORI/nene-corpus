<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use NeneCorpus\Mail\SmtpConfig;

final readonly class GetNotificationSettingsUseCase
{
    public function execute(): NotificationSettingsView
    {
        $smtp = SmtpConfig::fromEnvironment();
        $notify = NotificationConfig::fromEnvironment();

        return new NotificationSettingsView(
            smtpHost: $smtp !== null ? $smtp->host : '',
            smtpPort: $smtp !== null ? $smtp->port : 587,
            smtpUsername: $smtp !== null ? $smtp->username : '',
            smtpPasswordSet: $smtp !== null && $smtp->password !== '',
            smtpEncryption: $smtp !== null ? $smtp->encryption : 'tls',
            smtpFromAddress: $smtp !== null ? $smtp->fromAddress : '',
            smtpFromName: $smtp !== null ? $smtp->fromName : 'NeNe Corpus',
            smtpConfigured: $smtp !== null,
            notifyEmail: $notify->notifyEmail,
            rateLimitNotifyEnabled: $notify->rateLimitNotifyEnabled,
            rateLimitCooldownMinutes: $notify->rateLimitCooldownMinutes,
            dailyReportEnabled: $notify->dailyReportEnabled,
            dailyReportToken: $notify->dailyReportToken,
        );
    }
}
