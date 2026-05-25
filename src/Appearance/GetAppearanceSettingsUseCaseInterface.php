<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

interface GetAppearanceSettingsUseCaseInterface
{
    public function execute(): AppearanceSettings;
}
