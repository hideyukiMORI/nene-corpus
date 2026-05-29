<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

use DateTimeImmutable;
use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

final readonly class PdoAnalyticsRepository implements AnalyticsRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedOrgIdHolder $orgIdHolder,
    ) {
    }

    // ── Summary KPIs ─────────────────────────────────────────────────────────

    public function countSessionsToday(): int
    {
        $today = new DateTimeImmutable('today');

        $rows = $this->query->fetchAll(
            'SELECT COUNT(*) AS cnt FROM chat_sessions WHERE organization_id = ? AND created_at >= ? AND created_at < ?',
            [
                $this->orgId(),
                $today->format('Y-m-d 00:00:00'),
                $today->modify('+1 day')->format('Y-m-d 00:00:00'),
            ],
        );

        return (int) ($rows[0]['cnt'] ?? 0);
    }

    public function countSessionsThisWeek(): int
    {
        $since = (new DateTimeImmutable('-7 days'))->format('Y-m-d 00:00:00');

        $rows = $this->query->fetchAll(
            'SELECT COUNT(*) AS cnt FROM chat_sessions WHERE organization_id = ? AND created_at >= ?',
            [$this->orgId(), $since],
        );

        return (int) ($rows[0]['cnt'] ?? 0);
    }

    public function countSessionsTotal(): int
    {
        $rows = $this->query->fetchAll(
            'SELECT COUNT(*) AS cnt FROM chat_sessions WHERE organization_id = ?',
            [$this->orgId()],
        );

        return (int) ($rows[0]['cnt'] ?? 0);
    }

    public function countMessagesByRole(string $role): int
    {
        $rows = $this->query->fetchAll(
            'SELECT COUNT(*) AS cnt FROM chat_messages WHERE organization_id = ? AND role = ?',
            [$this->orgId(), $role],
        );

        return (int) ($rows[0]['cnt'] ?? 0);
    }

    public function sumTokens(string $column): int
    {
        $allowed = ['input_tokens', 'output_tokens'];

        if (!in_array($column, $allowed, true)) {
            return 0;
        }

        $rows = $this->query->fetchAll(
            "SELECT COALESCE(SUM({$column}), 0) AS total FROM chat_messages WHERE organization_id = ?",
            [$this->orgId()],
        );

        return (int) ($rows[0]['total'] ?? 0);
    }

    public function avgMessagesPerSession(): float
    {
        $rows = $this->query->fetchAll(
            <<<'SQL'
                SELECT
                    CASE WHEN COUNT(DISTINCT session_id) = 0 THEN 0.0
                         ELSE 1.0 * COUNT(*) / COUNT(DISTINCT session_id)
                    END AS avg_msg
                FROM chat_messages
                WHERE organization_id = ?
                SQL,
            [$this->orgId()],
        );

        return round((float) ($rows[0]['avg_msg'] ?? 0.0), 2);
    }

    public function citationRate(): float
    {
        $rows = $this->query->fetchAll(
            <<<'SQL'
                SELECT
                    1.0 * SUM(CASE WHEN citations_json IS NOT NULL AND citations_json != '[]' THEN 1 ELSE 0 END)
                        / NULLIF(COUNT(*), 0) AS rate
                FROM chat_messages
                WHERE organization_id = ?
                  AND role = 'assistant'
                SQL,
            [$this->orgId()],
        );

        $raw = $rows[0]['rate'] ?? null;

        return $raw === null ? 0.0 : round((float) $raw, 4);
    }

    // ── Trend / distribution ─────────────────────────────────────────────────

    public function dailyTrendRaw(int $days): array
    {
        $since = (new DateTimeImmutable("-{$days} days"))->format('Y-m-d 00:00:00');

        $rows = $this->query->fetchAll(
            <<<'SQL'
                SELECT
                    DATE(s.created_at) AS date,
                    COUNT(DISTINCT s.id) AS sessions,
                    COUNT(m.id) AS messages
                FROM chat_sessions s
                LEFT JOIN chat_messages m ON m.session_id = s.id
                WHERE s.organization_id = ?
                  AND s.created_at >= ?
                GROUP BY DATE(s.created_at)
                ORDER BY date ASC
                SQL,
            [$this->orgId(), $since],
        );

        return array_map(
            static fn (array $row): array => [
                'date'     => (string) $row['date'],
                'sessions' => (int) $row['sessions'],
                'messages' => (int) $row['messages'],
            ],
            $rows,
        );
    }

    public function hourlyDistributionRaw(): array
    {
        $rows = $this->query->fetchAll(
            <<<'SQL'
                SELECT
                    SUBSTR(created_at, 12, 2) AS hour,
                    COUNT(*) AS sessions
                FROM chat_sessions
                WHERE organization_id = ?
                GROUP BY SUBSTR(created_at, 12, 2)
                ORDER BY hour ASC
                SQL,
            [$this->orgId()],
        );

        return array_map(
            static fn (array $row): array => [
                'hour'     => (int) $row['hour'],
                'sessions' => (int) $row['sessions'],
            ],
            $rows,
        );
    }

    // ── Top questions ────────────────────────────────────────────────────────

    public function topQuestions(int $limit, ?string $from, ?string $to): array
    {
        $params = [$this->orgId()];
        $where  = ['organization_id = ?', "role = 'user'"];

        if ($from !== null) {
            $where[]  = 'created_at >= ?';
            $params[] = $from . ' 00:00:00';
        }

        if ($to !== null) {
            $where[]  = 'created_at <= ?';
            $params[] = $to . ' 23:59:59';
        }

        $whereClause = implode(' AND ', $where);
        $params[]    = $limit;

        $rows = $this->query->fetchAll(
            <<<SQL
                SELECT
                    MAX(TRIM(content)) AS content,
                    COUNT(*) AS count,
                    MAX(created_at) AS last_asked_at
                FROM chat_messages
                WHERE {$whereClause}
                GROUP BY LOWER(TRIM(content))
                ORDER BY count DESC, last_asked_at DESC
                LIMIT ?
                SQL,
            $params,
        );

        return array_map(
            static fn (array $row): array => [
                'content'      => (string) $row['content'],
                'count'        => (int) $row['count'],
                'last_asked_at' => (string) $row['last_asked_at'],
            ],
            $rows,
        );
    }

    // ── Export ───────────────────────────────────────────────────────────────

    public function exportSessions(?string $from, ?string $to): array
    {
        $params = [$this->orgId()];
        $where  = ['s.organization_id = ?'];

        if ($from !== null) {
            $where[]  = 's.created_at >= ?';
            $params[] = $from . ' 00:00:00';
        }

        if ($to !== null) {
            $where[]  = 's.created_at <= ?';
            $params[] = $to . ' 23:59:59';
        }

        $whereClause = implode(' AND ', $where);

        $rows = $this->query->fetchAll(
            <<<SQL
                SELECT
                    s.id AS session_id,
                    s.created_at,
                    s.client_ip,
                    s.referer,
                    s.user_agent,
                    COUNT(m.id) AS message_count,
                    COALESCE(SUM(m.input_tokens), 0) AS input_tokens,
                    COALESCE(SUM(m.output_tokens), 0) AS output_tokens,
                    MAX(CASE WHEN m.citations_json IS NOT NULL AND m.citations_json != '[]' THEN 1 ELSE 0 END) AS has_citation
                FROM chat_sessions s
                LEFT JOIN chat_messages m ON m.session_id = s.id
                WHERE {$whereClause}
                GROUP BY s.id
                ORDER BY s.id DESC
                SQL,
            $params,
        );

        return $rows;
    }

    public function exportConversations(?string $from, ?string $to): array
    {
        $params = [$this->orgId()];
        $where  = ['s.organization_id = ?'];

        if ($from !== null) {
            $where[]  = 's.created_at >= ?';
            $params[] = $from . ' 00:00:00';
        }

        if ($to !== null) {
            $where[]  = 's.created_at <= ?';
            $params[] = $to . ' 23:59:59';
        }

        $whereClause = implode(' AND ', $where);

        $rows = $this->query->fetchAll(
            <<<SQL
                SELECT
                    s.id AS session_id,
                    s.created_at AS session_created_at,
                    s.client_ip,
                    s.referer,
                    m.id AS message_id,
                    m.role,
                    m.content,
                    COALESCE(m.input_tokens, 0) AS input_tokens,
                    COALESCE(m.output_tokens, 0) AS output_tokens,
                    CASE WHEN m.citations_json IS NOT NULL AND m.citations_json != '[]' THEN 1 ELSE 0 END AS has_citation,
                    m.created_at AS message_created_at
                FROM chat_sessions s
                JOIN chat_messages m ON m.session_id = s.id
                WHERE {$whereClause}
                ORDER BY s.id ASC, m.id ASC
                SQL,
            $params,
        );

        return $rows;
    }

    private function orgId(): int
    {
        $id = $this->orgIdHolder->getId();

        if ($id === null) {
            throw new LogicException('Organization ID is not resolved. Check OrgResolverMiddleware setup.');
        }

        return $id;
    }
}
