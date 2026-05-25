<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

interface AppearanceSettingsRepositoryInterface
{
    public function get(): AppearanceSettings;

    public function save(AppearanceSettings $settings): void;
}
