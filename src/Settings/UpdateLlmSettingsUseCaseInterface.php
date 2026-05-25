<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

interface UpdateLlmSettingsUseCaseInterface
{
    public function execute(UpdateLlmSettingsInput $input): LlmSettingsView;

    /**
     * @param array<string, mixed> $body
     */
    public function executeFromBody(array $body): LlmSettingsView;
}
