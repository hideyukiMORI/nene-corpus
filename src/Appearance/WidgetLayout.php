<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class WidgetLayout
{
    public const POSITION_INLINE = 'inline';

    public const POSITION_BOTTOM_RIGHT = 'bottom_right';

    public const POSITION_BOTTOM_LEFT = 'bottom_left';

    public const POSITION_TOP_RIGHT = 'top_right';

    public const POSITION_TOP_LEFT = 'top_left';

    /** @var list<string> */
    public const POSITIONS = [
        self::POSITION_INLINE,
        self::POSITION_BOTTOM_RIGHT,
        self::POSITION_BOTTOM_LEFT,
        self::POSITION_TOP_RIGHT,
        self::POSITION_TOP_LEFT,
    ];

    public function __construct(
        public string $maxHeight = '32rem',
        public string $position = self::POSITION_INLINE,
        public int $offsetX = 16,
        public int $offsetY = 16,
        public bool $floatingLauncher = false,
    ) {
    }

    public static function defaults(): self
    {
        return new self();
    }

    /**
     * @return array{
     *     max_height: string,
     *     position: string,
     *     offset_x: int,
     *     offset_y: int,
     *     floating_launcher: bool
     * }
     */
    public function toArray(): array
    {
        return [
            'max_height' => $this->maxHeight,
            'position' => $this->position,
            'offset_x' => $this->offsetX,
            'offset_y' => $this->offsetY,
            'floating_launcher' => $this->floatingLauncher,
        ];
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data, ?self $fallback = null): self
    {
        $fallback ??= self::defaults();

        return new self(
            maxHeight: self::stringValue($data, 'max_height', $fallback->maxHeight),
            position: self::position($data, $fallback->position),
            offsetX: self::offset($data, 'offset_x', $fallback->offsetX),
            offsetY: self::offset($data, 'offset_y', $fallback->offsetY),
            floatingLauncher: self::nullableBool($data, 'floating_launcher', $fallback->floatingLauncher),
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function position(array $data, string $fallback): string
    {
        if (!array_key_exists('position', $data)) {
            return $fallback;
        }

        $value = $data['position'];

        if (!is_string($value) || !in_array($value, self::POSITIONS, true)) {
            return $fallback;
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function offset(array $data, string $key, int $fallback): int
    {
        if (!array_key_exists($key, $data)) {
            return $fallback;
        }

        $value = $data[$key];

        if (!is_int($value) && !(is_string($value) && ctype_digit($value))) {
            return $fallback;
        }

        $parsed = (int) $value;

        return max(0, min(256, $parsed));
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

    /**
     * @param array<string, mixed> $data
     */
    private static function stringValue(array $data, string $key, string $fallback): string
    {
        $value = $data[$key] ?? null;

        return is_string($value) && $value !== '' ? $value : $fallback;
    }
}
