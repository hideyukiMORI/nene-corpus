<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use NeneCorpus\Config\EnvironmentVariableUpdater;
use NeneCorpus\Install\EnvFileWriter;
use NeneCorpus\Mail\SmtpConfig;

final readonly class UpdateNotificationSettingsUseCase
{
    public function __construct(
        private EnvFileWriter $envFileWriter,
        private EnvironmentVariableUpdater $environmentUpdater,
        private GetNotificationSettingsUseCase $getUseCase,
    ) {
    }

    public function execute(UpdateNotificationSettingsInput $input): NotificationSettingsView
    {
        $currentSmtp = SmtpConfig::fromEnvironment();
        $currentNotify = NotificationConfig::fromEnvironment();

        // Keep existing password if not provided
        $password = $input->smtpPassword ?? ($currentSmtp !== null ? $currentSmtp->password : '');

        // Regenerate daily report token if requested or not yet set
        $token = $currentNotify->dailyReportToken;
        if ($input->regenerateDailyReportToken || $token === '') {
            $token = bin2hex(random_bytes(24));
        }

        $this->envFileWriter->write([
            'MAIL_HOST'             => $input->smtpHost,
            'MAIL_PORT'             => (string) $input->smtpPort,
            'MAIL_USERNAME'         => $input->smtpUsername,
            'MAIL_PASSWORD'         => $password,
            'MAIL_ENCRYPTION'       => $input->smtpEncryption,
            'MAIL_FROM_ADDRESS'     => $input->smtpFromAddress,
            'MAIL_FROM_NAME'        => $input->smtpFromName,
            'NOTIFY_EMAIL'          => $input->notifyEmail,
            'NOTIFY_RATE_LIMIT_ENABLED'             => $input->rateLimitNotifyEnabled ? 'true' : 'false',
            'NOTIFY_RATE_LIMIT_COOLDOWN_MINUTES'    => (string) $input->rateLimitCooldownMinutes,
            'NOTIFY_DAILY_REPORT_ENABLED'           => $input->dailyReportEnabled ? 'true' : 'false',
            'NOTIFY_DAILY_REPORT_TOKEN'             => $token,
        ]);

        $this->environmentUpdater->apply([
            'MAIL_HOST'             => $input->smtpHost,
            'MAIL_PORT'             => (string) $input->smtpPort,
            'MAIL_USERNAME'         => $input->smtpUsername,
            'MAIL_PASSWORD'         => $password,
            'MAIL_ENCRYPTION'       => $input->smtpEncryption,
            'MAIL_FROM_ADDRESS'     => $input->smtpFromAddress,
            'MAIL_FROM_NAME'        => $input->smtpFromName,
            'NOTIFY_EMAIL'          => $input->notifyEmail,
            'NOTIFY_RATE_LIMIT_ENABLED'             => $input->rateLimitNotifyEnabled ? 'true' : 'false',
            'NOTIFY_RATE_LIMIT_COOLDOWN_MINUTES'    => (string) $input->rateLimitCooldownMinutes,
            'NOTIFY_DAILY_REPORT_ENABLED'           => $input->dailyReportEnabled ? 'true' : 'false',
            'NOTIFY_DAILY_REPORT_TOKEN'             => $token,
        ]);

        return $this->getUseCase->execute();
    }
}
