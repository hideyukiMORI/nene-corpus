<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Settings;

use Nene2\Validation\ValidationException;
use NeneCorpus\Settings\LlmSettingsValidator;
use PHPUnit\Framework\TestCase;

/**
 * LlmSettingsValidator の境界値・型バリデーション敵対的テスト。
 *
 * 敵対的観点:
 *  - api_key 19文字は拒否（最低20文字必要）
 *  - api_key 20文字ちょうどは許可（境界値）
 *  - api_key が null → apiKeyProvided=true, apiKey=null （既存キー保持の意）
 *  - api_key が int 型 → エラー
 *  - max_tokens 0 → 1 にクランプ
 *  - max_tokens 8193 → 8192 にクランプ
 *  - model が空文字列 → エラー
 */
final class LlmSettingsValidatorTest extends TestCase
{
    private LlmSettingsValidator $validator;

    private const DEFAULT_MODEL = 'claude-3-5-haiku-20241022';

    protected function setUp(): void
    {
        $this->validator = new LlmSettingsValidator();
    }

    // ── api_key ───────────────────────────────────────────────────────

    public function test_api_key_absent_means_not_provided(): void
    {
        $input = $this->validator->validateUpdate([]);

        self::assertFalse($input->apiKeyProvided);
        self::assertNull($input->apiKey);
    }

    public function test_api_key_null_means_provided_but_keep_existing(): void
    {
        $input = $this->validator->validateUpdate(['api_key' => null]);

        self::assertTrue($input->apiKeyProvided);
        self::assertNull($input->apiKey);
    }

    public function test_api_key_whitespace_only_is_treated_as_empty(): void
    {
        $input = $this->validator->validateUpdate(['api_key' => '   ']);

        self::assertTrue($input->apiKeyProvided);
        self::assertNull($input->apiKey);
    }

    public function test_api_key_19_chars_throws(): void
    {
        // 境界値: 19文字は拒否（< 20）
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate(['api_key' => str_repeat('x', 19)]);
    }

    public function test_api_key_exactly_20_chars_is_accepted(): void
    {
        // 境界値: 20文字ちょうどは許可（>= 20）
        $key = str_repeat('x', 20);
        $input = $this->validator->validateUpdate(['api_key' => $key]);

        self::assertSame($key, $input->apiKey);
    }

    public function test_api_key_long_value_is_accepted(): void
    {
        $key = 'sk-ant-' . str_repeat('a', 93);

        $input = $this->validator->validateUpdate(['api_key' => $key]);

        self::assertSame($key, $input->apiKey);
    }

    public function test_api_key_integer_type_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate(['api_key' => 12345]);
    }

    public function test_api_key_array_type_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate(['api_key' => ['key']]);
    }

    public function test_api_key_short_throws_with_correct_field(): void
    {
        try {
            $this->validator->validateUpdate(['api_key' => str_repeat('x', 5)]);
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('api_key', $fields);
        }
    }

    // ── model ─────────────────────────────────────────────────────────

    public function test_model_absent_uses_default(): void
    {
        $input = $this->validator->validateUpdate([]);

        self::assertSame(self::DEFAULT_MODEL, $input->model);
    }

    public function test_model_empty_string_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate(['model' => '']);
    }

    public function test_model_whitespace_only_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate(['model' => '   ']);
    }

    public function test_model_integer_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate(['model' => 123]);
    }

    public function test_model_custom_string_is_accepted(): void
    {
        $input = $this->validator->validateUpdate(['model' => 'claude-opus-4-7']);

        self::assertSame('claude-opus-4-7', $input->model);
    }

    public function test_model_is_trimmed(): void
    {
        $input = $this->validator->validateUpdate(['model' => '  claude-sonnet-4-6  ']);

        self::assertSame('claude-sonnet-4-6', $input->model);
    }

    // ── max_tokens ───────────────────────────────────────────────────

    public function test_max_tokens_absent_uses_default_1024(): void
    {
        $input = $this->validator->validateUpdate([]);

        self::assertSame(1024, $input->maxTokens);
    }

    public function test_max_tokens_zero_is_clamped_to_1(): void
    {
        $input = $this->validator->validateUpdate(['max_tokens' => 0]);

        self::assertSame(1, $input->maxTokens);
    }

    public function test_max_tokens_negative_is_clamped_to_1(): void
    {
        $input = $this->validator->validateUpdate(['max_tokens' => -100]);

        self::assertSame(1, $input->maxTokens);
    }

    public function test_max_tokens_exactly_8192_is_accepted(): void
    {
        $input = $this->validator->validateUpdate(['max_tokens' => 8192]);

        self::assertSame(8192, $input->maxTokens);
    }

    public function test_max_tokens_8193_is_clamped_to_8192(): void
    {
        $input = $this->validator->validateUpdate(['max_tokens' => 8193]);

        self::assertSame(8192, $input->maxTokens);
    }

    public function test_max_tokens_large_value_is_clamped_to_8192(): void
    {
        $input = $this->validator->validateUpdate(['max_tokens' => 99999]);

        self::assertSame(8192, $input->maxTokens);
    }

    public function test_max_tokens_string_integer_is_accepted(): void
    {
        // コードは (!is_int && !is_string) でチェックしているので文字列は許可
        $input = $this->validator->validateUpdate(['max_tokens' => '2048']);

        self::assertSame(2048, $input->maxTokens);
    }

    public function test_max_tokens_non_numeric_string_is_clamped_to_1(): void
    {
        // コードは文字列を許可してから (int) キャスト → 'abc' = 0 → clamp(1,8192,0) = 1
        // 例外は throw されず 1 にクランプされる（実装の現状動作）
        $input = $this->validator->validateUpdate(['max_tokens' => 'not-a-number']);

        self::assertSame(1, $input->maxTokens);
    }

    public function test_max_tokens_array_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateUpdate(['max_tokens' => [1024]]);
    }

    // ── validateTest ─────────────────────────────────────────────────

    public function test_validate_test_without_api_key_returns_null_key(): void
    {
        $input = $this->validator->validateTest([]);

        self::assertNull($input->apiKey);
        self::assertSame(self::DEFAULT_MODEL, $input->model);
    }

    public function test_validate_test_with_api_key_is_accepted(): void
    {
        $key = 'sk-ant-' . str_repeat('k', 40);
        $input = $this->validator->validateTest(['api_key' => $key]);

        self::assertSame($key, $input->apiKey);
    }

    public function test_validate_test_api_key_integer_throws(): void
    {
        $this->expectException(ValidationException::class);

        $this->validator->validateTest(['api_key' => 99999]);
    }

    public function test_validate_test_with_model_override(): void
    {
        $input = $this->validator->validateTest(['model' => 'claude-haiku-4-5-20251001']);

        self::assertSame('claude-haiku-4-5-20251001', $input->model);
    }
}
