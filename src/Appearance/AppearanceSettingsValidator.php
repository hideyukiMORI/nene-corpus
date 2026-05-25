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
        $errors = [...$errors, ...$this->validateThemeField($theme, 'radius_md', 'css_length')];
        $errors = [...$errors, ...$this->validateThemeField($theme, 'max_width', 'css_length')];

        return $errors;
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
