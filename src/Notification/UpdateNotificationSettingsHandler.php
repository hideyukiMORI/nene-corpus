<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class UpdateNotificationSettingsHandler
{
    public function __construct(
        private UpdateNotificationSettingsUseCase $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);

        $errors = [];

        $smtpHost    = (string) ($body['smtp_host'] ?? '');
        $smtpPortRaw = $body['smtp_port'] ?? 587;
        $smtpPort    = is_numeric($smtpPortRaw) ? (int) $smtpPortRaw : 587;

        if ($smtpPort < 1 || $smtpPort > 65535) {
            $errors[] = new ValidationError('smtp_port', 'Port must be between 1 and 65535.', 'range');
        }

        $smtpUsername    = (string) ($body['smtp_username'] ?? '');
        $smtpPasswordRaw = $body['smtp_password'] ?? null;
        $smtpPassword    = $smtpPasswordRaw === null || $smtpPasswordRaw === '' ? null : (string) $smtpPasswordRaw;
        $smtpEncryption  = (string) ($body['smtp_encryption'] ?? 'tls');

        if (!in_array($smtpEncryption, ['tls', 'ssl', 'none'], true)) {
            $errors[] = new ValidationError('smtp_encryption', 'Must be tls, ssl, or none.', 'invalid');
        }

        $smtpFromAddress = (string) ($body['smtp_from_address'] ?? '');
        $smtpFromName    = (string) ($body['smtp_from_name'] ?? 'NeNe Corpus');
        $notifyEmail     = (string) ($body['notify_email'] ?? '');

        $cooldownRaw = $body['rate_limit_cooldown_minutes'] ?? 60;
        $cooldown    = is_numeric($cooldownRaw) ? (int) $cooldownRaw : 60;

        if ($cooldown < 1) {
            $errors[] = new ValidationError('rate_limit_cooldown_minutes', 'Must be at least 1.', 'min');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $input = new UpdateNotificationSettingsInput(
            smtpHost: $smtpHost,
            smtpPort: $smtpPort,
            smtpUsername: $smtpUsername,
            smtpPassword: $smtpPassword,
            smtpEncryption: $smtpEncryption,
            smtpFromAddress: $smtpFromAddress,
            smtpFromName: $smtpFromName,
            notifyEmail: $notifyEmail,
            rateLimitNotifyEnabled: (bool) ($body['rate_limit_notify_enabled'] ?? false),
            rateLimitCooldownMinutes: $cooldown,
            dailyReportEnabled: (bool) ($body['daily_report_enabled'] ?? false),
            regenerateDailyReportToken: (bool) ($body['regenerate_daily_report_token'] ?? false),
        );

        $view = $this->useCase->execute($input);

        return $this->response->create($view->toArray());
    }
}
