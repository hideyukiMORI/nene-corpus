<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

use Nene2\Database\DatabaseQueryExecutorInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

final readonly class PdoChatSettingsRepository implements ChatSettingsRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedOrgIdHolder $orgIdHolder,
    ) {
    }

    public function get(): ChatSettings
    {
        $orgId = $this->orgIdHolder->getId() ?? 1;

        $row = $this->query->fetchOne(
            'SELECT system_prompt, fallback_message FROM corpus_chat_settings WHERE organization_id = ? ORDER BY id ASC LIMIT 1',
            [$orgId],
        );

        if ($row === null) {
            return ChatSettings::defaults();
        }

        return new ChatSettings(
            systemPrompt: is_string($row['system_prompt'] ?? null) ? $row['system_prompt'] : null,
            fallbackMessage: is_string($row['fallback_message'] ?? null) ? $row['fallback_message'] : null,
        );
    }

    public function save(ChatSettings $settings): void
    {
        $orgId = $this->orgIdHolder->getId() ?? 1;
        $now = gmdate('Y-m-d H:i:s');
        $existing = $this->query->fetchOne('SELECT id FROM corpus_chat_settings WHERE organization_id = ? ORDER BY id ASC LIMIT 1', [$orgId]);

        if ($existing === null) {
            $this->query->execute(
                'INSERT INTO corpus_chat_settings (organization_id, system_prompt, fallback_message, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                [$orgId, $settings->systemPrompt, $settings->fallbackMessage, $now, $now],
            );

            return;
        }

        $this->query->execute(
            'UPDATE corpus_chat_settings SET system_prompt = ?, fallback_message = ?, updated_at = ? WHERE id = ? AND organization_id = ?',
            [$settings->systemPrompt, $settings->fallbackMessage, $now, (int) $existing['id'], $orgId],
        );
    }
}
