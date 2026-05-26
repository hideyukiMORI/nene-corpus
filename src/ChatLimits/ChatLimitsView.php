<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

final readonly class ChatLimitsView
{
    public function __construct(
        public int $maxMessageChars,
        public int $messageIntervalSeconds,
        public int $sessionRequestsPerHour,
        public int $ipRequestsPerHour,
        public int $dailyRequestsPerIp,
        public int $dailyRequestsGlobal,
        public int $dailyTokensPerIp,
        public int $dailyTokensGlobal,
    ) {
    }

    /**
     * @return array{
     *     max_message_chars: int,
     *     message_interval_seconds: int,
     *     session_requests_per_hour: int,
     *     ip_requests_per_hour: int,
     *     daily_requests_per_ip: int,
     *     daily_requests_global: int,
     *     daily_tokens_per_ip: int,
     *     daily_tokens_global: int,
     * }
     */
    public function toArray(): array
    {
        return [
            'max_message_chars' => $this->maxMessageChars,
            'message_interval_seconds' => $this->messageIntervalSeconds,
            'session_requests_per_hour' => $this->sessionRequestsPerHour,
            'ip_requests_per_hour' => $this->ipRequestsPerHour,
            'daily_requests_per_ip' => $this->dailyRequestsPerIp,
            'daily_requests_global' => $this->dailyRequestsGlobal,
            'daily_tokens_per_ip' => $this->dailyTokensPerIp,
            'daily_tokens_global' => $this->dailyTokensGlobal,
        ];
    }

    public static function fromSettings(ChatLimitsSettings $settings): self
    {
        return new self(
            maxMessageChars: $settings->maxMessageChars,
            messageIntervalSeconds: $settings->messageIntervalSeconds,
            sessionRequestsPerHour: $settings->sessionRequestsPerHour,
            ipRequestsPerHour: $settings->ipRequestsPerHour,
            dailyRequestsPerIp: $settings->dailyRequestsPerIp,
            dailyRequestsGlobal: $settings->dailyRequestsGlobal,
            dailyTokensPerIp: $settings->dailyTokensPerIp,
            dailyTokensGlobal: $settings->dailyTokensGlobal,
        );
    }
}
