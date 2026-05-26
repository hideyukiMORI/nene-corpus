<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

interface ChatTokenTrackerInterface
{
    /**
     * Adds token counts to the rolling daily windows for the given IP.
     * Both per-IP and global buckets are incremented.
     */
    public function track(string $ip, int $inputTokens, int $outputTokens): void;

    /**
     * Returns the total tokens consumed today for the given IP (input + output combined).
     */
    public function dailyTokensForIp(string $ip): int;

    /**
     * Returns the total tokens consumed today across all IPs (input + output combined).
     */
    public function dailyTokensGlobal(): int;
}
