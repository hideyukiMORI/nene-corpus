<?php

declare(strict_types=1);

namespace NeneCorpus\Message;

use Nene2\Database\DatabaseQueryExecutorInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

final readonly class PdoChatMessageRepository implements ChatMessageRepositoryInterface
{
    private const SELECT_COLUMNS = <<<'SQL'
        id, session_id, role, content, citations_json, input_tokens, output_tokens, created_at, updated_at
        SQL;

    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedOrgIdHolder $orgIdHolder,
    ) {
    }

    public function findById(int $id): ?ChatMessage
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM chat_messages WHERE id = ? AND organization_id = ?',
            [$id, $this->orgId()],
        );

        return $row === null ? null : $this->mapRow($row);
    }

    /** @return list<ChatMessage> */
    public function findBySessionId(int $sessionId, int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::SELECT_COLUMNS . ' FROM chat_messages WHERE session_id = ? AND organization_id = ? ORDER BY id ASC LIMIT ? OFFSET ?',
            [$sessionId, $this->orgId(), $limit, $offset],
        );

        return array_map(fn (array $row): ChatMessage => $this->mapRow($row), $rows);
    }

    public function save(ChatMessage $message): int
    {
        $now = $this->now();

        $this->query->execute(
            <<<'SQL'
                INSERT INTO chat_messages (
                    organization_id, session_id, role, content, citations_json, input_tokens, output_tokens, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                SQL,
            [
                $this->orgId(),
                $message->sessionId,
                $message->role->value,
                $message->content,
                $message->citationsJson,
                $message->inputTokens,
                $message->outputTokens,
                $now,
                $now,
            ],
        );

        return $this->query->lastInsertId();
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
    private function mapRow(array $row): ChatMessage
    {
        return new ChatMessage(
            sessionId: (int) $row['session_id'],
            role: MessageRole::from((string) $row['role']),
            content: (string) $row['content'],
            citationsJson: isset($row['citations_json']) ? (string) $row['citations_json'] : null,
            inputTokens: isset($row['input_tokens']) ? (int) $row['input_tokens'] : null,
            outputTokens: isset($row['output_tokens']) ? (int) $row['output_tokens'] : null,
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
