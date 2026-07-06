<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

use InvalidArgumentException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\ClockInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

final readonly class PdoChatSessionRepository implements ChatSessionRepositoryInterface
{
    private const SELECT_COLUMNS = <<<'SQL'
        id, public_token, client_ip, user_agent, referer, created_at, updated_at
        SQL;

    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedOrgIdHolder $orgIdHolder,
        private ClockInterface $clock,
    ) {
    }

    public function findById(int $id): ?ChatSession
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM chat_sessions WHERE id = ? AND organization_id = ?',
            [$id, $this->orgId()],
        );

        return $row === null ? null : $this->mapRow($row);
    }

    public function findByPublicToken(string $publicToken): ?ChatSession
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM chat_sessions WHERE public_token = ? AND organization_id = ?',
            [$publicToken, $this->orgId()],
        );

        return $row === null ? null : $this->mapRow($row);
    }

    public function save(ChatSession $session): int
    {
        $now = $this->now();

        $this->query->execute(
            'INSERT INTO chat_sessions (organization_id, public_token, client_ip, user_agent, referer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$this->orgId(), $session->publicToken, $session->clientIp, $session->userAgent, $session->referer, $now, $now],
        );

        return $this->query->lastInsertId();
    }

    public function update(ChatSession $session): void
    {
        if ($session->id === null) {
            throw new InvalidArgumentException('Chat session id is required for update.');
        }

        $this->query->execute(
            'UPDATE chat_sessions SET public_token = ?, updated_at = ? WHERE id = ? AND organization_id = ?',
            [$session->publicToken, $this->now(), $session->id, $this->orgId()],
        );
    }

    public function findAllSummaries(int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            <<<'SQL'
                SELECT
                    s.id, s.public_token, s.client_ip, s.user_agent, s.referer,
                    s.created_at, s.updated_at,
                    (
                        SELECT COUNT(*)
                        FROM chat_messages m
                        WHERE m.session_id = s.id
                    ) AS message_count,
                    (
                        SELECT MAX(m.created_at)
                        FROM chat_messages m
                        WHERE m.session_id = s.id
                    ) AS last_message_at
                FROM chat_sessions s
                WHERE s.organization_id = ?
                ORDER BY s.id DESC
                LIMIT ? OFFSET ?
                SQL,
            [$this->orgId(), $limit, $offset],
        );

        return array_map(
            fn (array $row): ChatSessionSummary => new ChatSessionSummary(
                session: $this->mapRow($row),
                messageCount: (int) $row['message_count'],
                lastMessageAt: isset($row['last_message_at']) ? (string) $row['last_message_at'] : null,
            ),
            $rows,
        );
    }

    public function countAll(): int
    {
        $rows = $this->query->fetchAll('SELECT COUNT(*) AS cnt FROM chat_sessions WHERE organization_id = ?', [$this->orgId()]);

        return (int) ($rows[0]['cnt'] ?? 0);
    }

    public function deleteOlderThan(int $days): int
    {
        $cutoff = gmdate('Y-m-d H:i:s', $this->clock->now()->getTimestamp() - $days * 86400);

        $before = $this->countAll();
        $this->query->execute('DELETE FROM chat_sessions WHERE created_at < ? AND organization_id = ?', [$cutoff, $this->orgId()]);

        return max(0, $before - $this->countAll());
    }

    private function orgId(): int
    {
        $id = $this->orgIdHolder->getId();

        if ($id === null) {
            throw new \LogicException('Organization ID is not resolved.');
        }

        return $id;
    }

    /**
     * @param array<string, mixed> $row
     */
    private function mapRow(array $row): ChatSession
    {
        return new ChatSession(
            publicToken: (string) $row['public_token'],
            id: (int) $row['id'],
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
            clientIp: isset($row['client_ip']) ? (string) $row['client_ip'] : null,
            userAgent: isset($row['user_agent']) ? (string) $row['user_agent'] : null,
            referer: isset($row['referer']) ? (string) $row['referer'] : null,
        );
    }

    private function now(): string
    {
        return $this->clock->now()->format('Y-m-d H:i:s');
    }
}
