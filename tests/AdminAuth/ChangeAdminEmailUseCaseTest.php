<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\AdminAuth;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use Nene2\Validation\ValidationException;
use NeneCorpus\AdminAuth\ChangeAdminEmailInput;
use NeneCorpus\AdminAuth\ChangeAdminEmailUseCase;
use NeneCorpus\AdminAuth\PdoAdminUserRepository;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\FixedClock;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * ChangeAdminEmailUseCase の敵対的テスト。
 *
 * 攻撃シナリオ:
 *  - 誤ったパスワードでメール変更を試みる
 *  - 様々な不正なメールアドレス形式（空文字・@なし・ドメインなし・二重@）
 *  - 有効な境界ケース（サブドメイン・plusアドレス）
 */
final class ChangeAdminEmailUseCaseTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;
    private PdoAdminUserRepository $repository;
    private ChangeAdminEmailUseCase $useCase;

    private const CURRENT_PASSWORD = 'correct-pass-99';
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
            ['original@example.com', $hash, $now, $now],
        );

        $adminRow = $this->executor->fetchOne('SELECT id FROM admin_users LIMIT 1');
        self::assertNotNull($adminRow);
        $this->adminId = (int) $adminRow['id'];
        $this->repository = new PdoAdminUserRepository($this->executor, new FixedClock());
        $this->useCase = new ChangeAdminEmailUseCase($this->repository);
    }

    // ── ハッピーパス ──────────────────────────────────────────────────

    public function test_execute_updates_email_with_valid_input(): void
    {
        $this->useCase->execute(new ChangeAdminEmailInput(
            adminId: $this->adminId,
            currentPassword: self::CURRENT_PASSWORD,
            newEmail: 'new@example.com',
        ));

        $user = $this->repository->findByEmail('new@example.com');
        self::assertNotNull($user);
        self::assertSame('new@example.com', $user->email);
    }

    public function test_execute_accepts_email_with_subdomain(): void
    {
        $this->useCase->execute(new ChangeAdminEmailInput(
            adminId: $this->adminId,
            currentPassword: self::CURRENT_PASSWORD,
            newEmail: 'admin@mail.sub.example.co.jp',
        ));

        $user = $this->repository->findByEmail('admin@mail.sub.example.co.jp');
        self::assertNotNull($user);
    }

    public function test_execute_accepts_email_with_plus_tag(): void
    {
        $this->useCase->execute(new ChangeAdminEmailInput(
            adminId: $this->adminId,
            currentPassword: self::CURRENT_PASSWORD,
            newEmail: 'admin+tag@example.com',
        ));

        $user = $this->repository->findByEmail('admin+tag@example.com');
        self::assertNotNull($user);
    }

    // ── 認証エラー ────────────────────────────────────────────────────

    public function test_execute_throws_for_wrong_current_password(): void
    {
        $this->expectException(ValidationException::class);

        $this->useCase->execute(new ChangeAdminEmailInput(
            adminId: $this->adminId,
            currentPassword: 'wrong-password',
            newEmail: 'hacker@evil.com',
        ));
    }

    public function test_execute_throws_with_field_current_password(): void
    {
        try {
            $this->useCase->execute(new ChangeAdminEmailInput(
                adminId: $this->adminId,
                currentPassword: 'wrong-password',
                newEmail: 'hacker@evil.com',
            ));
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('current_password', $fields);
        }
    }

    public function test_execute_throws_for_nonexistent_admin_id(): void
    {
        $this->expectException(ValidationException::class);

        $this->useCase->execute(new ChangeAdminEmailInput(
            adminId: 99999,
            currentPassword: self::CURRENT_PASSWORD,
            newEmail: 'new@example.com',
        ));
    }

    public function test_execute_does_not_change_email_on_wrong_password(): void
    {
        try {
            $this->useCase->execute(new ChangeAdminEmailInput(
                adminId: $this->adminId,
                currentPassword: 'wrong-password',
                newEmail: 'hacker@evil.com',
            ));
        } catch (ValidationException) {
            // expected
        }

        $user = $this->repository->findByEmail('original@example.com');
        self::assertNotNull($user);
        self::assertNull($this->repository->findByEmail('hacker@evil.com'));
    }

    // ── メール形式バリデーション ──────────────────────────────────────

    #[DataProvider('invalidEmailProvider')]
    public function test_execute_throws_for_invalid_email_format(string $invalidEmail): void
    {
        $this->expectException(ValidationException::class);

        $this->useCase->execute(new ChangeAdminEmailInput(
            adminId: $this->adminId,
            currentPassword: self::CURRENT_PASSWORD,
            newEmail: $invalidEmail,
        ));
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function invalidEmailProvider(): array
    {
        return [
            'empty string'         => [''],
            'no at-sign'           => ['notanemail'],
            'no domain after at'   => ['user@'],
            'no user before at'    => ['@domain.com'],
            'double at-sign'       => ['a@b@c.com'],
            'whitespace only'      => ['   '],
            'local part only'      => ['user'],
            'at only'              => ['@'],
        ];
    }

    public function test_execute_throws_with_field_new_email_for_invalid_format(): void
    {
        try {
            $this->useCase->execute(new ChangeAdminEmailInput(
                adminId: $this->adminId,
                currentPassword: self::CURRENT_PASSWORD,
                newEmail: 'notanemail',
            ));
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('new_email', $fields);
        }
    }
}
