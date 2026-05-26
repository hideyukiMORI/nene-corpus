<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

interface ChatSettingsRepositoryInterface
{
    public function get(): ChatSettings;

    public function save(ChatSettings $settings): void;
}
