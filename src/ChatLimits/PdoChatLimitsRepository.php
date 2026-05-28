<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

use Nene2\Database\DatabaseQueryExecutorInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

final readonly class PdoChatLimitsRepository implements ChatLimitsRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedOrgIdHolder $orgIdHolder,
    ) {
    }

    public function get(): ChatLimitsSettings
    {
        $orgId = $this->orgIdHolder->getId() ?? 1;

        $row = $this->query->fetchOne(
            'SELECT max_message_chars, message_interval_seconds, session_requests_per_hour,
                    ip_requests_per_hour, daily_requests_per_ip, daily_requests_global,
                    daily_tokens_per_ip, daily_tokens_global
             FROM chat_limits_settings WHERE organization_id = ? ORDER BY id ASC LIMIT 1',
            [$orgId],
        );

        if ($row === null) {
            return ChatLimitsSettings::defaults();
        }

        return new ChatLimitsSettings(
            maxMessageChars: (int) $row['max_message_chars'],
            messageIntervalSeconds: (int) $row['message_interval_seconds'],
            sessionRequestsPerHour: (int) $row['session_requests_per_hour'],
            ipRequestsPerHour: (int) $row['ip_requests_per_hour'],
            dailyRequestsPerIp: (int) $row['daily_requests_per_ip'],
            dailyRequestsGlobal: (int) $row['daily_requests_global'],
            dailyTokensPerIp: (int) $row['daily_tokens_per_ip'],
            dailyTokensGlobal: (int) $row['daily_tokens_global'],
        );
    }

    public function save(ChatLimitsSettings $settings): void
    {
        $orgId = $this->orgIdHolder->getId() ?? 1;
        $now = gmdate('Y-m-d H:i:s');
        $existing = $this->query->fetchOne('SELECT id FROM chat_limits_settings WHERE organization_id = ? ORDER BY id ASC LIMIT 1', [$orgId]);

        if ($existing === null) {
            $this->query->execute(
                'INSERT INTO chat_limits_settings
                 (organization_id, max_message_chars, message_interval_seconds, session_requests_per_hour,
                  ip_requests_per_hour, daily_requests_per_ip, daily_requests_global,
                  daily_tokens_per_ip, daily_tokens_global,
                  created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $orgId,
                    $settings->maxMessageChars,
                    $settings->messageIntervalSeconds,
                    $settings->sessionRequestsPerHour,
                    $settings->ipRequestsPerHour,
                    $settings->dailyRequestsPerIp,
                    $settings->dailyRequestsGlobal,
                    $settings->dailyTokensPerIp,
                    $settings->dailyTokensGlobal,
                    $now,
                    $now,
                ],
            );

            return;
        }

        $this->query->execute(
            'UPDATE chat_limits_settings
             SET max_message_chars = ?, message_interval_seconds = ?, session_requests_per_hour = ?,
                 ip_requests_per_hour = ?, daily_requests_per_ip = ?, daily_requests_global = ?,
                 daily_tokens_per_ip = ?, daily_tokens_global = ?,
                 updated_at = ?
             WHERE id = ? AND organization_id = ?',
            [
                $settings->maxMessageChars,
                $settings->messageIntervalSeconds,
                $settings->sessionRequestsPerHour,
                $settings->ipRequestsPerHour,
                $settings->dailyRequestsPerIp,
                $settings->dailyRequestsGlobal,
                $settings->dailyTokensPerIp,
                $settings->dailyTokensGlobal,
                $now,
                (int) $existing['id'],
                $orgId,
            ],
        );
    }
}
