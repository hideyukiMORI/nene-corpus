<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class AppearanceSettings
{
    public function __construct(
        public ?string $widgetLocale,
        public WidgetTheme $theme,
        public WidgetHero $hero,
        public WidgetChat $chat,
    ) {
    }

    public static function defaults(): self
    {
        return new self(
            widgetLocale: null,
            theme: WidgetTheme::defaults(),
            hero: WidgetHero::defaults(),
            chat: WidgetChat::defaults(),
        );
    }

    /**
     * @return array{
     *     widget_locale: string|null,
     *     theme: array{color_primary: string, color_surface: string, color_text: string, radius_md: string, max_width: string},
     *     hero: array{
     *         title: string|null,
     *         description: string|null,
     *         cta_label: string|null,
     *         show_title: bool,
     *         show_description: bool,
     *         show_cta: bool,
     *         show_image: bool,
     *         image_url: string|null,
     *         image_alt: string|null
     *     },
     *     chat: array{user_avatar_mode: string, show_assistant_avatar: bool}
     * }
     */
    public function toArray(): array
    {
        return [
            'widget_locale' => $this->widgetLocale,
            'theme' => $this->theme->toArray(),
            'hero' => $this->hero->toArray(),
            'chat' => $this->chat->toArray(),
        ];
    }
}
