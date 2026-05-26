<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\ChatLimits;

use Nene2\Validation\ValidationException;
use NeneCorpus\ChatLimits\ChatLimitsValidator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * ChatLimitsValidator の境界値・型バリデーション敵対的テスト。
 *
 * 攻撃シナリオ:
 *  - 全フィールド欠損（8エラーが一度に収集される）
 *  - 負値
 *  - float 型（int ではない）
 *  - 非数値文字列
 *  - 数値文字列 ("100") → 有効と判定されるか
 *  - 0 → 有効な境界値
 */
final class ChatLimitsValidatorTest extends TestCase
{
    private ChatLimitsValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new ChatLimitsValidator();
    }

    /** @return array<string, int> */
    private function validBody(): array
    {
        return [
            'max_message_chars'         => 500,
            'message_interval_seconds'  => 0,
            'session_requests_per_hour' => 60,
            'ip_requests_per_hour'      => 100,
            'daily_requests_per_ip'     => 200,
            'daily_requests_global'     => 5000,
            'daily_tokens_per_ip'       => 0,
            'daily_tokens_global'       => 0,
        ];
    }

    // ── ハッピーパス ──────────────────────────────────────────────────

    public function test_validate_update_accepts_all_zeros(): void
    {
        $input = $this->validator->validateUpdate(array_fill_keys(array_keys($this->validBody()), 0));

        self::assertSame(0, $input->maxMessageChars);
        self::assertSame(0, $input->dailyTokensGlobal);
    }

    public function test_validate_update_accepts_numeric_strings(): void
    {
        // ctype_digit な文字列は int と同等に受け付ける
        $body = array_map('strval', $this->validBody());

        $input = $this->validator->validateUpdate($body);

        self::assertSame(500, $input->maxMessageChars);
        self::assertSame(60, $input->sessionRequestsPerHour);
    }

    public function test_validate_update_returns_correct_input_dto(): void
    {
        $input = $this->validator->validateUpdate($this->validBody());

        self::assertSame(500, $input->maxMessageChars);
        self::assertSame(0, $input->messageIntervalSeconds);
        self::assertSame(60, $input->sessionRequestsPerHour);
        self::assertSame(100, $input->ipRequestsPerHour);
        self::assertSame(200, $input->dailyRequestsPerIp);
        self::assertSame(5000, $input->dailyRequestsGlobal);
        self::assertSame(0, $input->dailyTokensPerIp);
        self::assertSame(0, $input->dailyTokensGlobal);
    }

    // ── 全フィールド欠損 ──────────────────────────────────────────────

    public function test_validate_update_throws_with_all_8_errors_when_body_is_empty(): void
    {
        try {
            $this->validator->validateUpdate([]);
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            self::assertCount(8, $e->errors(), '8フィールド全てのエラーが収集されるべき');
        }
    }

    // ── 各フィールドの欠損 ────────────────────────────────────────────

    #[DataProvider('requiredFieldProvider')]
    public function test_validate_update_throws_when_field_is_missing(string $field): void
    {
        $body = $this->validBody();
        unset($body[$field]);

        try {
            $this->validator->validateUpdate($body);
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains($field, $fields);
        }
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function requiredFieldProvider(): array
    {
        return [
            'max_message_chars'         => ['max_message_chars'],
            'message_interval_seconds'  => ['message_interval_seconds'],
            'session_requests_per_hour' => ['session_requests_per_hour'],
            'ip_requests_per_hour'      => ['ip_requests_per_hour'],
            'daily_requests_per_ip'     => ['daily_requests_per_ip'],
            'daily_requests_global'     => ['daily_requests_global'],
            'daily_tokens_per_ip'       => ['daily_tokens_per_ip'],
            'daily_tokens_global'       => ['daily_tokens_global'],
        ];
    }

    // ── 型エラー・範囲エラー ──────────────────────────────────────────

    public function test_validate_update_throws_for_negative_value(): void
    {
        $body = $this->validBody();
        $body['max_message_chars'] = -1;

        try {
            $this->validator->validateUpdate($body);
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('max_message_chars', $fields);

            $codes = array_map(fn ($err) => $err->code, $e->errors());
            self::assertContains('min', $codes);
        }
    }

    public function test_validate_update_throws_for_float_value(): void
    {
        $body = $this->validBody();
        $body['daily_tokens_global'] = 1.5;

        try {
            $this->validator->validateUpdate($body);
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('daily_tokens_global', $fields);

            $codes = array_map(fn ($err) => $err->code, $e->errors());
            self::assertContains('invalid_type', $codes);
        }
    }

    public function test_validate_update_throws_for_non_numeric_string(): void
    {
        $body = $this->validBody();
        $body['session_requests_per_hour'] = 'abc';

        try {
            $this->validator->validateUpdate($body);
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('session_requests_per_hour', $fields);
        }
    }

    public function test_validate_update_throws_for_boolean_value(): void
    {
        $body = $this->validBody();
        $body['ip_requests_per_hour'] = true;

        try {
            $this->validator->validateUpdate($body);
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('ip_requests_per_hour', $fields);
        }
    }

    public function test_validate_update_throws_for_array_value(): void
    {
        $body = $this->validBody();
        $body['max_message_chars'] = [100];

        try {
            $this->validator->validateUpdate($body);
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('max_message_chars', $fields);
        }
    }

    public function test_validate_update_collects_multiple_errors_at_once(): void
    {
        // 複数フィールドが同時に不正でも一度に全エラーを返す
        $body = $this->validBody();
        $body['max_message_chars'] = -1;
        $body['daily_tokens_global'] = 'invalid';

        try {
            $this->validator->validateUpdate($body);
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            self::assertGreaterThanOrEqual(2, count($e->errors()));
        }
    }
}
