<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoAppearanceSettingsRepository implements AppearanceSettingsRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function get(): AppearanceSettings
    {
        $row = $this->query->fetchOne(
            'SELECT widget_locale, theme_json FROM appearance_settings ORDER BY id ASC LIMIT 1',
        );

        if ($row === null) {
            return AppearanceSettings::defaults();
        }

        $decoded = json_decode((string) $row['theme_json'], true);

        return new AppearanceSettings(
            widgetLocale: is_string($row['widget_locale'] ?? null) ? $row['widget_locale'] : null,
            theme: WidgetTheme::fromArray(is_array($decoded) ? $decoded : []),
        );
    }

    public function save(AppearanceSettings $settings): void
    {
        $now = gmdate('Y-m-d H:i:s');
        $themeJson = json_encode($settings->theme->toArray(), JSON_THROW_ON_ERROR);
        $existing = $this->query->fetchOne('SELECT id FROM appearance_settings ORDER BY id ASC LIMIT 1');

        if ($existing === null) {
            $this->query->execute(
                'INSERT INTO appearance_settings (widget_locale, theme_json, created_at, updated_at) VALUES (?, ?, ?, ?)',
                [$settings->widgetLocale, $themeJson, $now, $now],
            );

            return;
        }

        $this->query->execute(
            'UPDATE appearance_settings SET widget_locale = ?, theme_json = ?, updated_at = ? WHERE id = ?',
            [$settings->widgetLocale, $themeJson, $now, (int) $existing['id']],
        );
    }
}
