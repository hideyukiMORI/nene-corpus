<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

interface UpdateChatSettingsUseCaseInterface
{
    public function execute(UpdateChatSettingsInput $input): ChatSettingsView;

    /**
     * @param array<string, mixed> $body
     */
    public function executeFromBody(array $body): ChatSettingsView;
}
