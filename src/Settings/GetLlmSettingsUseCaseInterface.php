<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

interface GetLlmSettingsUseCaseInterface
{
    public function execute(): LlmSettingsView;
}
