<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

interface AnalyticsRepositoryInterface
{
    // ── Summary KPIs ─────────────────────────────────────────────────────────

    public function countSessionsToday(): int;

    public function countSessionsThisWeek(): int;

    public function countSessionsTotal(): int;

    public function countMessagesByRole(string $role): int;

    public function sumTokens(string $column): int;

    /** Average number of messages (all roles) per session. */
    public function avgMessagesPerSession(): float;

    /**
     * Fraction of assistant messages that have at least one citation.
     * Returns 0.0 when there are no assistant messages.
     */
    public function citationRate(): float;

    // ── Trend / distribution ─────────────────────────────────────────────────

    /**
     * Raw daily session + message counts for the last $days days.
     * Only dates that actually have data are returned.
     *
     * @return list<array{date: string, sessions: int, messages: int}>
     */
    public function dailyTrendRaw(int $days): array;

    /**
     * Raw session count by hour-of-day (UTC).
     * Only hours that actually have data are returned.
     *
     * @return list<array{hour: int, sessions: int}>
     */
    public function hourlyDistributionRaw(): array;

    // ── Top questions ────────────────────────────────────────────────────────

    /**
     * @return list<array{content: string, count: int, last_asked_at: string}>
     */
    public function topQuestions(int $limit, ?string $from, ?string $to): array;

    // ── Export ───────────────────────────────────────────────────────────────

    /**
     * Sessions with aggregated message counts and token totals for export.
     *
     * @return list<array<string, mixed>>
     */
    public function exportSessions(?string $from, ?string $to): array;

    /**
     * All messages (with session metadata) for export.
     *
     * @return list<array<string, mixed>>
     */
    public function exportConversations(?string $from, ?string $to): array;
}
