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
        ], $chat->toArray());
    }
}
