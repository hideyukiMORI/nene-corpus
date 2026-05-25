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
        public ?string $imageUrl = null,
        public ?string $imageAlt = null,
        public bool $showImage = true,
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
            imageUrl: null,
            imageAlt: null,
            showImage: true,
        );
    }

    /**
     * @return array{
     *     title: string|null,
     *     description: string|null,
     *     cta_label: string|null,
     *     show_title: bool,
     *     show_description: bool,
     *     show_cta: bool,
     *     image_url: string|null,
     *     image_alt: string|null,
     *     show_image: bool
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
            'image_url' => $this->imageUrl,
            'image_alt' => $this->imageAlt,
            'show_image' => $this->showImage,
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
            imageUrl: self::nullableImageUrl($data, 'image_url', $fallback->imageUrl),
            imageAlt: self::nullableString($data, 'image_alt', $fallback->imageAlt),
            showImage: self::nullableBool($data, 'show_image', $fallback->showImage),
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
    private static function nullableImageUrl(array $data, string $key, ?string $fallback): ?string
    {
        if (!array_key_exists($key, $data)) {
            return $fallback;
        }

        $value = $data[$key];

        if ($value === null || $value === '') {
            return null;
        }

        if (!is_string($value) || !HeroImagePath::isValidPublicPath($value)) {
            return $fallback;
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function nullableBool(array $data, string $key, bool $fallback): bool
    {
        if (!array_key_exists($key, $data)) {
            return $fallback;
        }

        return AppearanceBoolean::toBool($data[$key], $fallback);
    }
}
