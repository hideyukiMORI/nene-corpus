<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Appearance;

use NeneCorpus\Appearance\WidgetChat;
use PHPUnit\Framework\TestCase;

final class WidgetChatTest extends TestCase
{
    public function test_defaults(): void
    {
        $chat = WidgetChat::defaults();

        self::assertSame(WidgetChat::USER_AVATAR_SILHOUETTE, $chat->userAvatarMode);
        self::assertTrue($chat->showAssistantAvatar);
    }

    public function test_from_array_parses_user_avatar_mode(): void
    {
        $chat = WidgetChat::fromArray([
            'user_avatar_mode' => WidgetChat::USER_AVATAR_NONE,
            'show_assistant_avatar' => false,
        ]);

        self::assertSame(WidgetChat::USER_AVATAR_NONE, $chat->userAvatarMode);
        self::assertFalse($chat->showAssistantAvatar);
    }

    public function test_from_array_rejects_invalid_user_avatar_mode(): void
    {
        $chat = WidgetChat::fromArray([
            'user_avatar_mode' => 'photo',
        ]);

        self::assertSame(WidgetChat::USER_AVATAR_SILHOUETTE, $chat->userAvatarMode);
    }

    public function test_from_array_parses_loose_boolean_values(): void
    {
        $chat = WidgetChat::fromArray([
            'show_assistant_avatar' => 'false',
        ]);

        self::assertFalse($chat->showAssistantAvatar);
    }

    public function test_to_array(): void
    {
        $chat = new WidgetChat(
            userAvatarMode: WidgetChat::USER_AVATAR_NONE,
            showAssistantAvatar: false,
        );

        self::assertSame([
            'user_avatar_mode' => WidgetChat::USER_AVATAR_NONE,
            'show_assistant_avatar' => false,
            'assistant_avatar_url' => null,
            'assistant_avatar_alt' => null,
        ], $chat->toArray());
    }

    public function test_from_array_parses_assistant_avatar_url(): void
    {
        $chat = WidgetChat::fromArray([
            'assistant_avatar_url' => '/media/avatar/a1b2c3d4e5f67890_bot.png',
            'assistant_avatar_alt' => 'Support',
        ]);

        self::assertSame('/media/avatar/a1b2c3d4e5f67890_bot.png', $chat->assistantAvatarUrl);
        self::assertSame('Support', $chat->assistantAvatarAlt);
    }

    public function test_from_array_rejects_invalid_assistant_avatar_url(): void
    {
        $chat = WidgetChat::fromArray([
            'assistant_avatar_url' => 'https://evil.example/avatar.png',
        ]);

        self::assertNull($chat->assistantAvatarUrl);
    }
}
