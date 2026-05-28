<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use Nene2\Database\DatabaseQueryExecutorInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

final readonly class PdoDailyReportRepository implements DailyReportRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedOrgIdHolder $orgIdHolder,
    ) {
    }

    public function getStats(string $date): DailyReportStats
    {
        $orgId = $this->orgIdHolder->getId() ?? 1;
        $dateStart = $date . ' 00:00:00';
        $dateEnd   = $date . ' 23:59:59';

        // Sessions created today (org-scoped)
        $sessionRow = $this->query->fetchOne(
            'SELECT COUNT(*) AS cnt FROM chat_sessions WHERE organization_id = ? AND created_at BETWEEN ? AND ?',
            [$orgId, $dateStart, $dateEnd],
        );
        $totalSessions = (int) ($sessionRow['cnt'] ?? 0);

        // Messages created today (org-scoped via session join)
        $messageRow = $this->query->fetchOne(
            'SELECT COUNT(*) AS cnt FROM chat_messages cm
             JOIN chat_sessions cs ON cs.id = cm.session_id
             WHERE cs.organization_id = ? AND cm.created_at BETWEEN ? AND ?',
            [$orgId, $dateStart, $dateEnd],
        );
        $totalMessages = (int) ($messageRow['cnt'] ?? 0);

        // Unique IPs today (org-scoped)
        $ipRow = $this->query->fetchOne(
            'SELECT COUNT(DISTINCT client_ip) AS cnt FROM chat_sessions WHERE organization_id = ? AND created_at BETWEEN ? AND ?',
            [$orgId, $dateStart, $dateEnd],
        );
        $uniqueIps = (int) ($ipRow['cnt'] ?? 0);

        // Rate limit hits today: bucket key is org-prefixed
        $rateLimitRow = $this->query->fetchOne(
            'SELECT COALESCE(SUM(hit_count), 0) AS cnt FROM rate_limit_buckets WHERE bucket_key = ?',
            ['notify:ratelimit:hits:' . $orgId . ':' . $date],
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
