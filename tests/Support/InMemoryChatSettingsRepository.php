<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

use NeneCorpus\ChatSettings\ChatSettings;
use NeneCorpus\ChatSettings\ChatSettingsRepositoryInterface;

final class InMemoryChatSettingsRepository implements ChatSettingsRepositoryInterface
{
    public function __construct(
        private ChatSettings $settings,
    ) {
    }

    public function get(): ChatSettings
    {
        return $this->settings;
    }

    public function save(ChatSettings $settings): void
    {
        $this->settings = $settings;
    }
}
