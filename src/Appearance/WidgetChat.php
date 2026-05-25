<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class WidgetChat
{
    public const USER_AVATAR_SILHOUETTE = 'silhouette';

    public const USER_AVATAR_NONE = 'none';

    /** @var list<string> */
    public const USER_AVATAR_MODES = [self::USER_AVATAR_SILHOUETTE, self::USER_AVATAR_NONE];

    public function __construct(
        public string $userAvatarMode = self::USER_AVATAR_SILHOUETTE,
        public bool $showAssistantAvatar = true,
        public ?string $assistantAvatarUrl = null,
        public ?string $assistantAvatarAlt = null,
    ) {
    }

    public static function defaults(): self
    {
        return new self(
            userAvatarMode: self::USER_AVATAR_SILHOUETTE,
            showAssistantAvatar: true,
            assistantAvatarUrl: null,
            assistantAvatarAlt: null,
        );
    }

    /**
     * @return array{
     *     user_avatar_mode: string,
     *     show_assistant_avatar: bool,
     *     assistant_avatar_url: string|null,
     *     assistant_avatar_alt: string|null
     * }
     */
    public function toArray(): array
    {
        return [
            'user_avatar_mode' => $this->userAvatarMode,
            'show_assistant_avatar' => $this->showAssistantAvatar,
            'assistant_avatar_url' => $this->assistantAvatarUrl,
            'assistant_avatar_alt' => $this->assistantAvatarAlt,
        ];
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data, ?self $fallback = null): self
    {
        $fallback ??= self::defaults();

        return new self(
            userAvatarMode: self::userAvatarMode($data, $fallback->userAvatarMode),
            showAssistantAvatar: self::nullableBool($data, 'show_assistant_avatar', $fallback->showAssistantAvatar),
            assistantAvatarUrl: self::nullableAvatarUrl($data, 'assistant_avatar_url', $fallback->assistantAvatarUrl),
            assistantAvatarAlt: self::nullableString($data, 'assistant_avatar_alt', $fallback->assistantAvatarAlt),
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function userAvatarMode(array $data, string $fallback): string
    {
        if (!array_key_exists('user_avatar_mode', $data)) {
            return $fallback;
        }

        $value = $data['user_avatar_mode'];

        if (!is_string($value) || !in_array($value, self::USER_AVATAR_MODES, true)) {
            return $fallback;
        }

        return $value;
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
    private static function nullableAvatarUrl(array $data, string $key, ?string $fallback): ?string
    {
        if (!array_key_exists($key, $data)) {
            return $fallback;
        }

        $value = $data[$key];

        if ($value === null || $value === '') {
            return null;
        }

        if (!is_string($value) || !AvatarImagePath::isValidPublicPath($value)) {
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
