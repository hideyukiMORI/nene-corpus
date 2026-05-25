<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class AppearanceSettings
{
    public function __construct(
        public ?string $widgetLocale,
        public WidgetTheme $theme,
    ) {
    }

    public static function defaults(): self
    {
        return new self(
            widgetLocale: null,
            theme: WidgetTheme::defaults(),
        );
    }

    /**
     * @return array{widget_locale: string|null, theme: array{color_primary: string, color_surface: string, color_text: string, radius_md: string, max_width: string}}
     */
    public function toArray(): array
    {
        return [
            'widget_locale' => $this->widgetLocale,
            'theme' => $this->theme->toArray(),
        ];
    }
}
