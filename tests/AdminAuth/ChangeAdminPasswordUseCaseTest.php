<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\AdminAuth;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use Nene2\Validation\ValidationException;
use NeneCorpus\AdminAuth\ChangeAdminPasswordInput;
use NeneCorpus\AdminAuth\ChangeAdminPasswordUseCase;
use NeneCorpus\AdminAuth\PdoAdminUserRepository;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\FixedClock;
use PHPUnit\Framework\TestCase;

/**
 * ChangeAdminPasswordUseCase の敵対的テスト。
 *
 * 攻撃シナリオ:
 *  - 誤ったパスワードで変更しようとする
 *  - 存在しない adminId を指定する
 *  - 新パスワードを 7 文字（最低 8 文字未満）にする
 *  - 新パスワードをちょうど 8 文字（境界値）にする
 *  - 変更後は新パスワードで再ログインできる（旧パスワードは無効）
 */
final class ChangeAdminPasswordUseCaseTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;
    private PdoAdminUserRepository $repository;
    private ChangeAdminPasswordUseCase $useCase;

    private const CURRENT_PASSWORD = 'correct-current-pw';
    private int $adminId;

    protected function setUp(): void
    {
        $this->executor = new PdoDatabaseQueryExecutor(new PdoConnectionFactory(new DatabaseConfig(
            null,
            'test',
            'sqlite',
            'localhost',
            1,
            ':memory:',
            'nene_corpus',
            '',
            'utf8',
        )));

        CorpusSchemaSetup::createAdminUsers($this->executor);

        $hash = password_hash(self::CURRENT_PASSWORD, PASSWORD_ARGON2ID);
        $now = gmdate('Y-m-d H:i:s');
        $this->executor->execute(
            'INSERT INTO admin_users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
            ['admin@example.com', $hash, $now, $now],
        );

        $adminRow = $this->executor->fetchOne('SELECT id FROM admin_users LIMIT 1');
        self::assertNotNull($adminRow);
        $this->adminId = (int) $adminRow['id'];
        $this->repository = new PdoAdminUserRepository($this->executor, new FixedClock());
        $this->useCase = new ChangeAdminPasswordUseCase($this->repository);
    }

    // ── ハッピーパス ──────────────────────────────────────────────────

    public function test_execute_succeeds_with_exactly_8_char_new_password(): void
    {
        // 境界値: 8文字ちょうどは許可される
        $this->useCase->execute(new ChangeAdminPasswordInput(
            adminId: $this->adminId,
            currentPassword: self::CURRENT_PASSWORD,
            newPassword: '12345678',
        ));

        $user = $this->repository->findById($this->adminId);
        self::assertNotNull($user);
        self::assertTrue(password_verify('12345678', $user->passwordHash));
    }

    public function test_execute_succeeds_with_long_new_password(): void
    {
        $newPw = str_repeat('a', 100);

        $this->useCase->execute(new ChangeAdminPasswordInput(
            adminId: $this->adminId,
            currentPassword: self::CURRENT_PASSWORD,
            newPassword: $newPw,
        ));

        $user = $this->repository->findById($this->adminId);
        self::assertNotNull($user);
        self::assertTrue(password_verify($newPw, $user->passwordHash));
    }

    public function test_execute_invalidates_old_password_after_change(): void
    {
        $this->useCase->execute(new ChangeAdminPasswordInput(
            adminId: $this->adminId,
            currentPassword: self::CURRENT_PASSWORD,
            newPassword: 'new-secure-pw',
        ));

        $user = $this->repository->findById($this->adminId);
        self::assertNotNull($user);
        // 旧パスワードは使えなくなる
        self::assertFalse(password_verify(self::CURRENT_PASSWORD, $user->passwordHash));
        // 新パスワードで検証できる
        self::assertTrue(password_verify('new-secure-pw', $user->passwordHash));
    }

    // ── エラーパス ────────────────────────────────────────────────────

    public function test_execute_throws_for_wrong_current_password(): void
    {
        $this->expectException(ValidationException::class);

        $this->useCase->execute(new ChangeAdminPasswordInput(
            adminId: $this->adminId,
            currentPassword: 'wrong-password',
            newPassword: 'new-secure-pw',
        ));
    }

    public function test_execute_throws_with_field_current_password_for_wrong_password(): void
    {
        try {
            $this->useCase->execute(new ChangeAdminPasswordInput(
                adminId: $this->adminId,
                currentPassword: 'wrong-password',
                newPassword: 'new-secure-pw',
            ));
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('current_password', $fields);
        }
    }

    public function test_execute_throws_for_nonexistent_admin_id(): void
    {
        // 存在しないIDは「パスワード不一致」と同じ扱い（情報漏洩防止）
        $this->expectException(ValidationException::class);

        $this->useCase->execute(new ChangeAdminPasswordInput(
            adminId: 99999,
            currentPassword: self::CURRENT_PASSWORD,
            newPassword: 'new-secure-pw',
        ));
    }

    public function test_execute_throws_for_new_password_too_short_7_chars(): void
    {
        // 境界値: 7文字は最低8文字未満なので拒否される
        $this->expectException(ValidationException::class);

        $this->useCase->execute(new ChangeAdminPasswordInput(
            adminId: $this->adminId,
            currentPassword: self::CURRENT_PASSWORD,
            newPassword: '1234567',
        ));
    }

    public function test_execute_throws_with_field_new_password_for_short_password(): void
    {
        try {
            $this->useCase->execute(new ChangeAdminPasswordInput(
                adminId: $this->adminId,
                currentPassword: self::CURRENT_PASSWORD,
                newPassword: '1234567',
            ));
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('new_password', $fields);
        }
    }

    public function test_execute_does_not_change_password_when_current_is_wrong(): void
    {
        // 失敗した場合にパスワードが変わっていないことを確認
        try {
            $this->useCase->execute(new ChangeAdminPasswordInput(
                adminId: $this->adminId,
                currentPassword: 'wrong-password',
                newPassword: 'hacker-new-pw',
            ));
        } catch (ValidationException) {
            // expected
        }

        $user = $this->repository->findById($this->adminId);
        self::assertNotNull($user);
        // 元のパスワードはまだ有効
        self::assertTrue(password_verify(self::CURRENT_PASSWORD, $user->passwordHash));
    }

    public function test_execute_does_not_change_password_when_new_is_too_short(): void
    {
        try {
            $this->useCase->execute(new ChangeAdminPasswordInput(
                adminId: $this->adminId,
                currentPassword: self::CURRENT_PASSWORD,
                newPassword: 'short',
            ));
        } catch (ValidationException) {
            // expected
        }

        $user = $this->repository->findById($this->adminId);
        self::assertNotNull($user);
        self::assertTrue(password_verify(self::CURRENT_PASSWORD, $user->passwordHash));
    }
}
