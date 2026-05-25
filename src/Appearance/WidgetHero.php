<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class WidgetHero
{
    public function __construct(
        public ?string $title,
        public ?string $description,
        public ?string $ctaLabel,
        public bool $showTitle = true,
        public bool $showDescription = true,
        public bool $showCta = true,
    ) {
    }

    public static function defaults(): self
    {
        return new self(
            title: null,
            description: null,
            ctaLabel: null,
            showTitle: true,
            showDescription: true,
            showCta: true,
        );
    }

    /**
     * @return array{
     *     title: string|null,
     *     description: string|null,
     *     cta_label: string|null,
     *     show_title: bool,
     *     show_description: bool,
     *     show_cta: bool
     * }
     */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'description' => $this->description,
            'cta_label' => $this->ctaLabel,
            'show_title' => $this->showTitle,
            'show_description' => $this->showDescription,
            'show_cta' => $this->showCta,
        ];
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data, ?self $fallback = null): self
    {
        $fallback ??= self::defaults();

        return new self(
            title: self::nullableString($data, 'title', $fallback->title),
            description: self::nullableString($data, 'description', $fallback->description),
            ctaLabel: self::nullableString($data, 'cta_label', $fallback->ctaLabel),
            showTitle: self::nullableBool($data, 'show_title', $fallback->showTitle),
            showDescription: self::nullableBool($data, 'show_description', $fallback->showDescription),
            showCta: self::nullableBool($data, 'show_cta', $fallback->showCta),
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function nullableString(array $data, string $key, ?string $fallback): ?string
    {
        if (!array_key_exists($key, $data)) {
            return $fallback;
        }

        $value = $data[$key];

        if ($value === null || $value === '') {
            return null;
        }

        return is_string($value) ? $value : $fallback;
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function nullableBool(array $data, string $key, bool $fallback): bool
    {
        if (!array_key_exists($key, $data)) {
            return $fallback;
        }

        $value = $data[$key];

        if (is_bool($value)) {
            return $value;
        }

        if ($value === 1 || $value === '1') {
            return true;
        }

        if ($value === 0 || $value === '0') {
            return false;
        }

        return $fallback;
    }
}
