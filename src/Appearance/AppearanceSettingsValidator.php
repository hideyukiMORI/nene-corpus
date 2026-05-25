<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use Nene2\Validation\ValidationError;

final readonly class AppearanceSettingsValidator
{
    /** @var list<string> */
    private const SUPPORTED_LOCALES = ['en', 'ja', 'fr', 'zh-Hans', 'pt-BR', 'de'];

    /**
     * @param array<string, mixed> $body
     * @return list<ValidationError>
     */
    public function validate(array $body): array
    {
        $errors = [];
        $widgetLocale = $body['widget_locale'] ?? null;

        if ($widgetLocale !== null && $widgetLocale !== '') {
            if (!is_string($widgetLocale) || !in_array($widgetLocale, self::SUPPORTED_LOCALES, true)) {
                $errors[] = new ValidationError(
                    'widget_locale',
                    'Widget locale must be one of: ' . implode(', ', self::SUPPORTED_LOCALES) . '.',
                    'invalid',
                );
            }
        }

        $theme = $body['theme'] ?? null;

        if (!is_array($theme)) {
            $errors[] = new ValidationError('theme', 'Theme object is required.', 'required');

            return $errors;
        }

        $errors = [...$errors, ...$this->validateThemeField($theme, 'color_primary', 'hex_color')];
        $errors = [...$errors, ...$this->validateThemeField($theme, 'color_surface', 'hex_color')];
        $errors = [...$errors, ...$this->validateThemeField($theme, 'color_text', 'hex_color')];
        $errors = [...$errors, ...$this->validateThemeField($theme, 'radius_panel', 'css_length')];
        $errors = [...$errors, ...$this->validateThemeField($theme, 'radius_control', 'css_length')];
        $errors = [...$errors, ...$this->validateThemeField($theme, 'max_width', 'css_length')];

        $hero = $body['hero'] ?? null;

        if (!is_array($hero)) {
            $errors[] = new ValidationError('hero', 'Hero object is required.', 'required');

            return $errors;
        }

        $errors = [...$errors, ...$this->validateOptionalHeroField($hero, 'title', 120)];
        $errors = [...$errors, ...$this->validateOptionalHeroField($hero, 'description', 500)];
        $errors = [...$errors, ...$this->validateOptionalHeroField($hero, 'cta_label', 40)];
        $errors = [...$errors, ...$this->validateOptionalHeroField($hero, 'image_alt', 120)];
        $errors = [...$errors, ...$this->validateOptionalHeroImageUrl($hero, 'image_url')];
        $errors = [...$errors, ...$this->validateOptionalHeroBool($hero, 'show_title')];
        $errors = [...$errors, ...$this->validateOptionalHeroBool($hero, 'show_description')];
        $errors = [...$errors, ...$this->validateOptionalHeroBool($hero, 'show_cta')];
        $errors = [...$errors, ...$this->validateOptionalHeroBool($hero, 'show_image')];
        $errors = [...$errors, ...$this->validateOptionalHeroCssLength($hero, 'gap_after')];
        $errors = [...$errors, ...$this->validateOptionalHeroCssLength($hero, 'padding_bottom')];
        $errors = [...$errors, ...$this->validateOptionalHeroBool($hero, 'show_divider')];

        $chat = $body['chat'] ?? null;

        if (!is_array($chat)) {
            $errors[] = new ValidationError('chat', 'Chat object is required.', 'required');

            return $errors;
        }

        $errors = [...$errors, ...$this->validateChat($chat)];

        $layout = $body['layout'] ?? null;

        if (!is_array($layout)) {
            $errors[] = new ValidationError('layout', 'Layout object is required.', 'required');

            return $errors;
        }

        $errors = [...$errors, ...$this->validateLayout($layout)];

        return $errors;
    }

    /**
     * @param array<string, mixed> $layout
     * @return list<ValidationError>
     */
    private function validateLayout(array $layout): array
    {
        $errors = [];

        $maxHeight = $layout['max_height'] ?? null;

        if (!is_string($maxHeight) || $maxHeight === '') {
            $errors[] = new ValidationError('layout.max_height', 'Max height is required.', 'required');
        } elseif (!preg_match('/^\d+(\.\d+)?(px|rem|em|%)$/', $maxHeight)) {
            $errors[] = new ValidationError('layout.max_height', 'Must be a CSS length (e.g. 32rem or 480px).', 'invalid');
        }

        if (array_key_exists('position', $layout)) {
            $value = $layout['position'];

            if (!is_string($value) || !in_array($value, WidgetLayout::POSITIONS, true)) {
                $errors[] = new ValidationError(
                    'layout.position',
                    'Position must be one of: ' . implode(', ', WidgetLayout::POSITIONS) . '.',
                    'invalid',
                );
            }
        }

        foreach (['offset_x', 'offset_y'] as $key) {
            if (!array_key_exists($key, $layout)) {
                continue;
            }

            $value = $layout[$key];

            if (!is_int($value) && !(is_string($value) && ctype_digit($value))) {
                $errors[] = new ValidationError("layout.{$key}", ucfirst(str_replace('_', ' ', $key)) . ' must be an integer.', 'invalid');

                continue;
            }

            $parsed = (int) $value;

            if ($parsed < 0 || $parsed > 256) {
                $errors[] = new ValidationError("layout.{$key}", 'Must be between 0 and 256.', 'invalid');
            }
        }

        if (array_key_exists('floating_launcher', $layout) && !AppearanceBoolean::isValid($layout['floating_launcher'])) {
            $errors[] = new ValidationError(
                'layout.floating_launcher',
                'Floating launcher must be a boolean.',
                'invalid',
            );
        }

        $position = is_string($layout['position'] ?? null) ? $layout['position'] : WidgetLayout::POSITION_INLINE;
        $floatingLauncher = AppearanceBoolean::toBool($layout['floating_launcher'] ?? false, false);

        if ($floatingLauncher && $position === WidgetLayout::POSITION_INLINE) {
            $errors[] = new ValidationError(
                'layout.floating_launcher',
                'Floating launcher requires a fixed position (not inline).',
                'invalid',
            );
        }

        return $errors;
    }

    /**
     * @param array<string, mixed> $chat
     * @return list<ValidationError>
     */
    private function validateChat(array $chat): array
    {
        $errors = [];

        if (array_key_exists('user_avatar_mode', $chat)) {
            $value = $chat['user_avatar_mode'];

            if (!is_string($value) || !in_array($value, WidgetChat::USER_AVATAR_MODES, true)) {
                $errors[] = new ValidationError(
                    'chat.user_avatar_mode',
                    'User avatar mode must be one of: ' . implode(', ', WidgetChat::USER_AVATAR_MODES) . '.',
                    'invalid',
                );
            }
        }

        if (array_key_exists('show_assistant_avatar', $chat) && !AppearanceBoolean::isValid($chat['show_assistant_avatar'])) {
            $errors[] = new ValidationError(
                'chat.show_assistant_avatar',
                'Show assistant avatar must be a boolean.',
                'invalid',
            );
        }

        $errors = [...$errors, ...$this->validateOptionalChatField($chat, 'assistant_avatar_alt', 120)];
        $errors = [...$errors, ...$this->validateOptionalAvatarImageUrl($chat, 'assistant_avatar_url')];

        return $errors;
    }

    /**
     * @param array<string, mixed> $chat
     * @return list<ValidationError>
     */
    private function validateOptionalAvatarImageUrl(array $chat, string $key): array
    {
        if (!array_key_exists($key, $chat)) {
            return [];
        }

        $value = $chat[$key];

        if ($value === null || $value === '') {
            return [];
        }

        if (!is_string($value) || !AvatarImagePath::isValidPublicPath($value)) {
            return [new ValidationError("chat.{$key}", 'Image URL must be a valid avatar image path.', 'invalid')];
        }

        return [];
    }

    /**
     * @param array<string, mixed> $chat
     * @return list<ValidationError>
     */
    private function validateOptionalChatField(array $chat, string $key, int $maxLength): array
    {
        if (!array_key_exists($key, $chat)) {
            return [];
        }

        $value = $chat[$key];

        if ($value === null || $value === '') {
            return [];
        }

        if (!is_string($value)) {
            return [new ValidationError("chat.{$key}", ucfirst(str_replace('_', ' ', $key)) . ' must be a string.', 'invalid')];
        }

        if (mb_strlen($value) > $maxLength) {
            return [new ValidationError("chat.{$key}", 'Must be at most ' . $maxLength . ' characters.', 'max_length')];
        }

        return [];
    }

    /**
     * @param array<string, mixed> $hero
     * @return list<ValidationError>
     */
    private function validateOptionalHeroImageUrl(array $hero, string $key): array
    {
        if (!array_key_exists($key, $hero)) {
            return [];
        }

        $value = $hero[$key];

        if ($value === null || $value === '') {
            return [];
        }

        if (!is_string($value) || !HeroImagePath::isValidPublicPath($value)) {
            return [new ValidationError("hero.{$key}", 'Image URL must be a valid hero image path.', 'invalid')];
        }

        return [];
    }

    /**
     * @param array<string, mixed> $hero
     * @return list<ValidationError>
     */
    private function validateOptionalHeroBool(array $hero, string $key): array
    {
        if (!array_key_exists($key, $hero)) {
            return [];
        }

        if (AppearanceBoolean::isValid($hero[$key])) {
            return [];
        }

        return [new ValidationError("hero.{$key}", ucfirst(str_replace('_', ' ', $key)) . ' must be a boolean.', 'invalid')];
    }

    /**
     * @param array<string, mixed> $hero
     * @return list<ValidationError>
     */
    private function validateOptionalHeroCssLength(array $hero, string $key): array
    {
        if (!array_key_exists($key, $hero)) {
            return [];
        }

        $value = $hero[$key];

        if (!is_string($value) || $value === '') {
            return [new ValidationError("hero.{$key}", ucfirst(str_replace('_', ' ', $key)) . ' is required.', 'required')];
        }

        if (!preg_match('/^\d+(\.\d+)?(px|rem|em|%)$/', $value)) {
            return [new ValidationError("hero.{$key}", 'Must be a CSS length (e.g. 1rem or 0px).', 'invalid')];
        }

        return [];
    }

    /**
     * @param array<string, mixed> $hero
     * @return list<ValidationError>
     */
    private function validateOptionalHeroField(array $hero, string $key, int $maxLength): array
    {
        if (!array_key_exists($key, $hero)) {
            return [];
        }

        $value = $hero[$key];

        if ($value === null || $value === '') {
            return [];
        }

        if (!is_string($value)) {
            return [new ValidationError("hero.{$key}", ucfirst(str_replace('_', ' ', $key)) . ' must be a string.', 'invalid')];
        }

        if (mb_strlen($value) > $maxLength) {
            return [new ValidationError("hero.{$key}", 'Must be at most ' . $maxLength . ' characters.', 'max_length')];
        }

        return [];
    }

    /**
     * @param array<string, mixed> $theme
     * @return list<ValidationError>
     */
    private function validateThemeField(array $theme, string $key, string $type): array
    {
        $value = $theme[$key] ?? null;

        if (!is_string($value) || $value === '') {
            return [new ValidationError("theme.{$key}", ucfirst(str_replace('_', ' ', $key)) . ' is required.', 'required')];
        }

        if ($type === 'hex_color' && !preg_match('/^#[0-9A-Fa-f]{6}$/', $value)) {
            return [new ValidationError("theme.{$key}", 'Must be a 6-digit hex color (e.g. #2563eb).', 'invalid')];
        }

        if ($type === 'css_length' && !preg_match('/^\d+(\.\d+)?(px|rem|em|%)$/', $value)) {
            return [new ValidationError("theme.{$key}", 'Must be a CSS length (e.g. 0.5rem or 100%).', 'invalid')];
        }

        return [];
    }
}
