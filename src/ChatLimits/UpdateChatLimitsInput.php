<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

final readonly class UpdateChatLimitsInput
{
    public function __construct(
        public int $maxMessageChars,
        public int $messageIntervalSeconds,
        public int $sessionRequestsPerHour,
        public int $ipRequestsPerHour,
        public int $dailyRequestsPerIp,
        public int $dailyRequestsGlobal,
    ) {
    }
}
