<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use Nene2\Validation\ValidationException;

final readonly class UpdateAppearanceSettingsUseCase implements UpdateAppearanceSettingsUseCaseInterface
{
    public function __construct(
        private AppearanceSettingsRepositoryInterface $repository,
        private AppearanceSettingsValidator $validator,
    ) {
    }

    public function execute(UpdateAppearanceSettingsInput $input): AppearanceSettings
    {
        /** @var array<string, mixed> $body */
        $body = $this->normalizeBody($input->body);
        $errors = $this->validator->validate($body);

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $widgetLocale = $body['widget_locale'] ?? null;
        $normalizedLocale = is_string($widgetLocale) && $widgetLocale !== '' ? $widgetLocale : null;
        /** @var array<string, mixed> $themeData */
        $themeData = $body['theme'];
        /** @var array<string, mixed> $heroData */
        $heroData = is_array($body['hero'] ?? null) ? $body['hero'] : [];
        /** @var array<string, mixed> $chatData */
        $chatData = is_array($body['chat'] ?? null) ? $body['chat'] : [];
        /** @var array<string, mixed> $layoutData */
        $layoutData = is_array($body['layout'] ?? null) ? $body['layout'] : [];

        $rawCustomCss = $body['custom_css'] ?? null;
        $customCss = is_string($rawCustomCss) && trim($rawCustomCss) !== '' ? trim($rawCustomCss) : null;

        $settings = new AppearanceSettings(
            widgetLocale: $normalizedLocale,
            theme: WidgetTheme::fromArray($themeData),
            hero: WidgetHero::fromArray($heroData),
            chat: WidgetChat::fromArray($chatData),
            layout: WidgetLayout::fromArray($layoutData),
            customCss: $customCss,
        );

        $this->repository->save($settings);

        return $settings;
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    private function normalizeBody(array $body): array
    {
        if (!is_array($body['chat'] ?? null)) {
            $body['chat'] = WidgetChat::defaults()->toArray();
        }

        if (!is_array($body['layout'] ?? null)) {
            $body['layout'] = WidgetLayout::defaults()->toArray();
        }

        if (is_array($body['theme'] ?? null)) {
            $body['theme'] = $this->normalizeTheme($body['theme']);
        }

        if (is_array($body['hero'] ?? null)) {
            $body['hero'] = [...WidgetHero::defaults()->toArray(), ...$body['hero']];
        }

        return $body;
    }

    /**
     * @param array<string, mixed> $theme
     * @return array<string, mixed>
     */
    private function normalizeTheme(array $theme): array
    {
        $defaults = WidgetTheme::defaults()->toArray();
        $legacyRadius = is_string($theme['radius_md'] ?? null) && $theme['radius_md'] !== ''
            ? $theme['radius_md']
            : $defaults['radius_panel'];

        if (!is_string($theme['radius_panel'] ?? null) || $theme['radius_panel'] === '') {
            $theme['radius_panel'] = $legacyRadius;
        }

        if (!is_string($theme['radius_control'] ?? null) || $theme['radius_control'] === '') {
            $theme['radius_control'] = $legacyRadius;
        }

        return $theme;
    }
}
