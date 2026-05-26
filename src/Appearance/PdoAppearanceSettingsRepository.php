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
            'SELECT widget_locale, theme_json, hero_json, chat_json, layout_json, custom_css FROM appearance_settings ORDER BY id ASC LIMIT 1',
        );

        if ($row === null) {
            return AppearanceSettings::defaults();
        }

        $themeDecoded = json_decode((string) $row['theme_json'], true);
        $heroDecoded = json_decode((string) ($row['hero_json'] ?? ''), true);
        $chatDecoded = json_decode((string) ($row['chat_json'] ?? ''), true);
        $layoutDecoded = json_decode((string) ($row['layout_json'] ?? ''), true);

        return new AppearanceSettings(
            widgetLocale: is_string($row['widget_locale'] ?? null) ? $row['widget_locale'] : null,
            theme: WidgetTheme::fromArray(is_array($themeDecoded) ? $themeDecoded : []),
            hero: WidgetHero::fromArray(is_array($heroDecoded) ? $heroDecoded : []),
            chat: WidgetChat::fromArray(is_array($chatDecoded) ? $chatDecoded : []),
            layout: WidgetLayout::fromArray(is_array($layoutDecoded) ? $layoutDecoded : []),
            customCss: is_string($row['custom_css'] ?? null) ? $row['custom_css'] : null,
        );
    }

    public function save(AppearanceSettings $settings): void
    {
        $now = gmdate('Y-m-d H:i:s');
        $themeJson = json_encode($settings->theme->toArray(), JSON_THROW_ON_ERROR);
        $heroJson = json_encode($settings->hero->toArray(), JSON_THROW_ON_ERROR);
        $chatJson = json_encode($settings->chat->toArray(), JSON_THROW_ON_ERROR);
        $layoutJson = json_encode($settings->layout->toArray(), JSON_THROW_ON_ERROR);
        $existing = $this->query->fetchOne('SELECT id FROM appearance_settings ORDER BY id ASC LIMIT 1');

        if ($existing === null) {
            $this->query->execute(
                'INSERT INTO appearance_settings (widget_locale, theme_json, hero_json, chat_json, layout_json, custom_css, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [$settings->widgetLocale, $themeJson, $heroJson, $chatJson, $layoutJson, $settings->customCss, $now, $now],
            );

            return;
        }

        $this->query->execute(
            'UPDATE appearance_settings SET widget_locale = ?, theme_json = ?, hero_json = ?, chat_json = ?, layout_json = ?, custom_css = ?, updated_at = ? WHERE id = ?',
            [$settings->widgetLocale, $themeJson, $heroJson, $chatJson, $layoutJson, $settings->customCss, $now, (int) $existing['id']],
        );
    }
}
