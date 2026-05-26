<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

final readonly class ChatLimitsSettings
{
    public function __construct(
        /** Max characters per user message. 0 = no limit. */
        public int $maxMessageChars,
        /** Minimum seconds between messages in the same session. 0 = no limit. */
        public int $messageIntervalSeconds,
        /** Max requests per session per hour. 0 = no limit. */
        public int $sessionRequestsPerHour,
        /** Max requests per IP per hour. 0 = no limit. */
        public int $ipRequestsPerHour,
        /** Max requests per IP per day (rolling 24 h). 0 = no limit. */
        public int $dailyRequestsPerIp,
        /** Max requests across all IPs per day (rolling 24 h). 0 = no limit. */
        public int $dailyRequestsGlobal,
    ) {
    }

    public static function defaults(): self
    {
        return new self(
            maxMessageChars: 800,
            messageIntervalSeconds: 10,
            sessionRequestsPerHour: 20,
            ipRequestsPerHour: 60,
            dailyRequestsPerIp: 200,
            dailyRequestsGlobal: 2000,
        );
    }
}
