<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class WidgetTheme
{
    public function __construct(
        public string $colorPrimary,
        public string $colorSurface,
        public string $colorText,
        public string $radiusPanel,
        public string $radiusControl,
        public string $maxWidth,
    ) {
    }

    public static function defaults(): self
    {
        return new self(
            colorPrimary: '#2563eb',
            colorSurface: '#ffffff',
            colorText: '#1f2937',
            radiusPanel: '0.5rem',
            radiusControl: '0.5rem',
            maxWidth: '100%',
        );
    }

    /**
     * @return array{
     *     color_primary: string,
     *     color_surface: string,
     *     color_text: string,
     *     radius_panel: string,
     *     radius_control: string,
     *     max_width: string
     * }
     */
    public function toArray(): array
    {
        return [
            'color_primary' => $this->colorPrimary,
            'color_surface' => $this->colorSurface,
            'color_text' => $this->colorText,
            'radius_panel' => $this->radiusPanel,
            'radius_control' => $this->radiusControl,
            'max_width' => $this->maxWidth,
        ];
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data, ?self $fallback = null): self
    {
        $fallback ??= self::defaults();
        $legacyRadius = self::stringValue($data, 'radius_md', $fallback->radiusPanel);

        return new self(
            colorPrimary: self::stringValue($data, 'color_primary', $fallback->colorPrimary),
            colorSurface: self::stringValue($data, 'color_surface', $fallback->colorSurface),
            colorText: self::stringValue($data, 'color_text', $fallback->colorText),
            radiusPanel: self::stringValue($data, 'radius_panel', $legacyRadius),
            radiusControl: self::stringValue($data, 'radius_control', $legacyRadius),
            maxWidth: self::stringValue($data, 'max_width', $fallback->maxWidth),
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function stringValue(array $data, string $key, string $fallback): string
    {
        $value = $data[$key] ?? null;

        return is_string($value) && $value !== '' ? $value : $fallback;
    }
}
