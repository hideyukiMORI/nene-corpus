<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

interface DailyReportRepositoryInterface
{
    /**
     * Returns stats for the given date string (Y-m-d in server local time).
     */
    public function getStats(string $date): DailyReportStats;
}
