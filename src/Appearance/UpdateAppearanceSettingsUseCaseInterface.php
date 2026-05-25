<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

interface UpdateAppearanceSettingsUseCaseInterface
{
    public function execute(UpdateAppearanceSettingsInput $input): AppearanceSettings;
}
