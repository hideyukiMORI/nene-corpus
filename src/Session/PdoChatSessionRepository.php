<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

use InvalidArgumentException;
use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoChatSessionRepository implements ChatSessionRepositoryInterface
{
    private const SELECT_COLUMNS = <<<'SQL'
        id, public_token, created_at, updated_at
        SQL;

    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function findById(int $id): ?ChatSession
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM chat_sessions WHERE id = ?',
            [$id],
        );

        return $row === null ? null : $this->mapRow($row);
    }

    public function findByPublicToken(string $publicToken): ?ChatSession
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM chat_sessions WHERE public_token = ?',
            [$publicToken],
        );

        return $row === null ? null : $this->mapRow($row);
    }

    public function save(ChatSession $session): int
    {
        $now = $this->now();

        $this->query->execute(
            'INSERT INTO chat_sessions (public_token, created_at, updated_at) VALUES (?, ?, ?)',
            [$session->publicToken, $now, $now],
        );

        return $this->query->lastInsertId();
    }

    public function update(ChatSession $session): void
    {
        if ($session->id === null) {
            throw new InvalidArgumentException('Chat session id is required for update.');
        }

        $this->query->execute(
            'UPDATE chat_sessions SET public_token = ?, updated_at = ? WHERE id = ?',
            [$session->publicToken, $this->now(), $session->id],
        );
    }

    public function findAllSummaries(int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            <<<'SQL'
                SELECT
                    s.id, s.public_token, s.created_at, s.updated_at,
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
                ORDER BY s.id DESC
                LIMIT ? OFFSET ?
                SQL,
            [$limit, $offset],
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
        );
    }

    private function now(): string
    {
        return gmdate('Y-m-d H:i:s');
    }
}
