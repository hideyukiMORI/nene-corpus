<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoDailyReportRepository implements DailyReportRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function getStats(string $date): DailyReportStats
    {
        $dateStart = $date . ' 00:00:00';
        $dateEnd   = $date . ' 23:59:59';

        // Sessions created today
        $sessionRow = $this->query->fetchOne(
            'SELECT COUNT(*) AS cnt FROM chat_sessions WHERE created_at BETWEEN ? AND ?',
            [$dateStart, $dateEnd],
        );
        $totalSessions = (int) ($sessionRow['cnt'] ?? 0);

        // Messages created today
        $messageRow = $this->query->fetchOne(
            'SELECT COUNT(*) AS cnt FROM chat_messages WHERE created_at BETWEEN ? AND ?',
            [$dateStart, $dateEnd],
        );
        $totalMessages = (int) ($messageRow['cnt'] ?? 0);

        // Unique IPs today
        $ipRow = $this->query->fetchOne(
            'SELECT COUNT(DISTINCT client_ip) AS cnt FROM chat_sessions WHERE created_at BETWEEN ? AND ?',
            [$dateStart, $dateEnd],
        );
        $uniqueIps = (int) ($ipRow['cnt'] ?? 0);

        // Rate limit hits today: reuse bucket keys with pattern notify:ratelimit:hits:{date}
        $rateLimitRow = $this->query->fetchOne(
            'SELECT COALESCE(SUM(hit_count), 0) AS cnt FROM rate_limit_buckets WHERE bucket_key = ?',
            ['notify:ratelimit:hits:' . $date],
        );
        $rateLimitHits = (int) ($rateLimitRow['cnt'] ?? 0);

        return new DailyReportStats(
            reportDate: $date,
            totalSessions: $totalSessions,
            totalMessages: $totalMessages,
            uniqueIps: $uniqueIps,
            rateLimitHits: $rateLimitHits,
        );
    }
}
