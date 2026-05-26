<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

interface GetChatSettingsUseCaseInterface
{
    public function execute(): ChatSettingsView;
}
