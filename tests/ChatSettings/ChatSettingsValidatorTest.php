<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\ChatSettings;

use Nene2\Validation\ValidationException;
use NeneCorpus\ChatSettings\ChatSettingsValidator;
use PHPUnit\Framework\TestCase;

/**
 * ChatSettingsValidator の境界値テスト。
 *
 * 敵対的観点:
 *  - system_prompt / fallback_message の上限は 4000 / 500 文字
 *  - 空白のみ → null として扱われる
 *  - キー自体が存在しない → 変更なしとして扱われる（null が保持される）
 *  - 非文字列型 → エラー
 */
final class ChatSettingsValidatorTest extends TestCase
{
    private ChatSettingsValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new ChatSettingsValidator();
    }

    // ── system_prompt ─────────────────────────────────────────────────

    public function test_system_prompt_exactly_at_limit_is_accepted(): void
    {
        $input = $this->validator->validateUpdate([
            'system_prompt' => str_repeat('a', 4000),
        ]);

        self::assertSame(str_repeat('a', 4000), $input->systemPrompt);
    }

    public function test_system_prompt_one_over_limit_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate([
            'system_prompt' => str_repeat('a', 4001),
        ]);
    }

    public function test_system_prompt_one_over_limit_error_has_correct_field(): void
    {
        try {
            $this->validator->validateUpdate([
                'system_prompt' => str_repeat('a', 4001),
            ]);
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('system_prompt', $fields);
        }
    }

    public function test_system_prompt_whitespace_only_becomes_null(): void
    {
        $input = $this->validator->validateUpdate([
            'system_prompt' => '   ',
        ]);

        self::assertNull($input->systemPrompt);
    }

    public function test_system_prompt_null_value_is_accepted(): void
    {
        $input = $this->validator->validateUpdate([
            'system_prompt' => null,
        ]);

        self::assertNull($input->systemPrompt);
    }

    public function test_system_prompt_key_absent_results_in_null(): void
    {
        $input = $this->validator->validateUpdate([]);

        self::assertNull($input->systemPrompt);
    }

    public function test_system_prompt_integer_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate([
            'system_prompt' => 42,
        ]);
    }

    public function test_system_prompt_array_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate([
            'system_prompt' => ['value'],
        ]);
    }

    public function test_system_prompt_is_trimmed(): void
    {
        $input = $this->validator->validateUpdate([
            'system_prompt' => '  Answer in Japanese.  ',
        ]);

        self::assertSame('Answer in Japanese.', $input->systemPrompt);
    }

    // ── fallback_message ─────────────────────────────────────────────

    public function test_fallback_message_exactly_at_limit_is_accepted(): void
    {
        $input = $this->validator->validateUpdate([
            'fallback_message' => str_repeat('b', 500),
        ]);

        self::assertSame(str_repeat('b', 500), $input->fallbackMessage);
    }

    public function test_fallback_message_one_over_limit_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate([
            'fallback_message' => str_repeat('b', 501),
        ]);
    }

    public function test_fallback_message_one_over_limit_has_correct_field(): void
    {
        try {
            $this->validator->validateUpdate([
                'fallback_message' => str_repeat('b', 501),
            ]);
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('fallback_message', $fields);
        }
    }

    public function test_fallback_message_whitespace_only_becomes_null(): void
    {
        $input = $this->validator->validateUpdate([
            'fallback_message' => "\t\n  ",
        ]);

        self::assertNull($input->fallbackMessage);
    }

    public function test_fallback_message_null_value_is_accepted(): void
    {
        $input = $this->validator->validateUpdate([
            'fallback_message' => null,
        ]);

        self::assertNull($input->fallbackMessage);
    }

    public function test_fallback_message_boolean_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate([
            'fallback_message' => false,
        ]);
    }

    // ── 複合 ──────────────────────────────────────────────────────────

    public function test_both_fields_null_is_valid(): void
    {
        $input = $this->validator->validateUpdate([
            'system_prompt'    => null,
            'fallback_message' => null,
        ]);

        self::assertNull($input->systemPrompt);
        self::assertNull($input->fallbackMessage);
    }

    public function test_both_fields_over_limit_collects_both_errors(): void
    {
        try {
            $this->validator->validateUpdate([
                'system_prompt'    => str_repeat('a', 4001),
                'fallback_message' => str_repeat('b', 501),
            ]);
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('system_prompt', $fields);
            self::assertContains('fallback_message', $fields);
        }
    }

    public function test_multibyte_chars_counted_correctly_in_system_prompt(): void
    {
        // mb_strlen で 4000 文字の日本語 → 受け入れ
        $input = $this->validator->validateUpdate([
            'system_prompt' => str_repeat('あ', 4000),
        ]);

        self::assertNotNull($input->systemPrompt);
        self::assertSame(4000, mb_strlen((string) $input->systemPrompt));
    }

    public function test_multibyte_chars_over_limit_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate([
            'system_prompt' => str_repeat('あ', 4001),
        ]);
    }
}
