<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

interface ChatLimitsRepositoryInterface
{
    public function get(): ChatLimitsSettings;

    public function save(ChatLimitsSettings $settings): void;
}
