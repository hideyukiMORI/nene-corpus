<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class WidgetHero
{
    public function __construct(
        public ?string $title,
        public ?string $description,
        public ?string $ctaLabel,
    ) {
    }

    public static function defaults(): self
    {
        return new self(
            title: null,
            description: null,
            ctaLabel: null,
        );
    }

    /**
     * @return array{title: string|null, description: string|null, cta_label: string|null}
     */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'description' => $this->description,
            'cta_label' => $this->ctaLabel,
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
}
