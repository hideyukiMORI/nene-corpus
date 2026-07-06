<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\AdminAuth;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\AdminAuth\AdminPasswordReset;
use NeneCorpus\AdminAuth\ConfirmPasswordResetUseCase;
use NeneCorpus\AdminAuth\InvalidPasswordResetTokenException;
use NeneCorpus\AdminAuth\PdoAdminPasswordResetRepository;
use NeneCorpus\AdminAuth\PdoAdminUserRepository;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\FixedClock;
use PHPUnit\Framework\TestCase;

/**
 * ConfirmPasswordResetUseCase の敵対的テスト。
 *
 * 攻撃シナリオ:
 *  - 空トークンで突破を試みる
 *  - 存在しないトークンを送る
 *  - 期限切れトークンを再利用する
 *  - 使用済みトークンを再利用する
 *  - 短いパスワードをセットしようとする（パスワードチェックはDB参照前）
 *  - 正常フロー後にトークンが再利用できないことを確認
 */
final class ConfirmPasswordResetUseCaseTest extends TestCase
{
    /** Fixed "now" used by the injected clock (UTC). */
    private const NOW = '2026-06-15 12:00:00';

    private PdoDatabaseQueryExecutor $executor;
    private PdoAdminUserRepository $users;
    private PdoAdminPasswordResetRepository $resets;
    private ConfirmPasswordResetUseCase $useCase;
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
        CorpusSchemaSetup::createAdminPasswordResets($this->executor);

        $hash = password_hash('old-password', PASSWORD_ARGON2ID);
        $now = gmdate('Y-m-d H:i:s');
        $this->executor->execute(
            'INSERT INTO admin_users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
            ['admin@example.com', $hash, $now, $now],
        );

        $adminRow = $this->executor->fetchOne('SELECT id FROM admin_users LIMIT 1');
        self::assertNotNull($adminRow);
        $this->adminId = (int) $adminRow['id'];
        $this->users = new PdoAdminUserRepository($this->executor);
        $this->resets = new PdoAdminPasswordResetRepository($this->executor);
        // Fixed clock so token-expiry boundaries are deterministic (no wall-clock).
        $this->useCase = new ConfirmPasswordResetUseCase($this->resets, $this->users, new FixedClock(self::NOW . 'Z'));
    }

    // ── ガード: 空トークン・短パスワード (DB前チェック) ──────────────

    public function test_execute_throws_for_empty_token(): void
    {
        $this->expectException(InvalidPasswordResetTokenException::class);

        $this->useCase->execute('', 'valid-new-password');
    }

    public function test_execute_throws_for_new_password_too_short_before_db_lookup(): void
    {
        // パスワード長チェックはDB参照前なので、存在しないトークンでも同じ例外が出る
        $this->expectException(InvalidPasswordResetTokenException::class);

        $this->useCase->execute('some-raw-token', '1234567'); // 7文字
    }

    public function test_execute_throws_for_new_password_exactly_7_chars(): void
    {
        // 境界値: 7文字は拒否
        $this->expectException(InvalidPasswordResetTokenException::class);

        $this->useCase->execute('some-token', str_repeat('a', 7));
    }

    // ── DB系エラー ────────────────────────────────────────────────────

    public function test_execute_throws_for_nonexistent_token(): void
    {
        $this->expectException(InvalidPasswordResetTokenException::class);

        $this->useCase->execute('nonexistent-raw-token', 'new-password-123');
    }

    public function test_execute_throws_for_expired_token(): void
    {
        $rawToken = 'expired-raw-token';
        $tokenHash = hash('sha256', $rawToken);

        $this->resets->save(new AdminPasswordReset(
            tokenHash: $tokenHash,
            adminUserId: $this->adminId,
            expiresAt: '2026-06-15 11:59:59', // 固定 now の1秒前に期限切れ
            usedAt: null,
            createdAt: gmdate('Y-m-d H:i:s'),
        ));

        $this->expectException(InvalidPasswordResetTokenException::class);

        $this->useCase->execute($rawToken, 'new-password-123');
    }

    public function test_execute_throws_for_already_used_token(): void
    {
        $rawToken = 'used-raw-token';
        $tokenHash = hash('sha256', $rawToken);

        $this->resets->save(new AdminPasswordReset(
            tokenHash: $tokenHash,
            adminUserId: $this->adminId,
            expiresAt: '2026-06-15 13:00:00', // 固定 now の1時間後（有効）
            usedAt: gmdate('Y-m-d H:i:s'), // 使用済み
            createdAt: gmdate('Y-m-d H:i:s'),
        ));

        $this->expectException(InvalidPasswordResetTokenException::class);

        $this->useCase->execute($rawToken, 'new-password-123');
    }

    // ── ハッピーパス ──────────────────────────────────────────────────

    public function test_execute_succeeds_with_valid_token_and_password(): void
    {
        $rawToken = 'valid-raw-token';
        $tokenHash = hash('sha256', $rawToken);

        $this->resets->save(new AdminPasswordReset(
            tokenHash: $tokenHash,
            adminUserId: $this->adminId,
            expiresAt: '2026-06-15 13:00:00', // 固定 now の1時間後（有効）
            usedAt: null,
            createdAt: gmdate('Y-m-d H:i:s'),
        ));

        $this->useCase->execute($rawToken, 'brand-new-password');

        $user = $this->users->findById($this->adminId);
        self::assertNotNull($user);
        self::assertTrue(password_verify('brand-new-password', $user->passwordHash));
        self::assertFalse(password_verify('old-password', $user->passwordHash));
    }

    public function test_execute_marks_token_used_after_success(): void
    {
        $rawToken = 'one-time-token';
        $tokenHash = hash('sha256', $rawToken);

        $this->resets->save(new AdminPasswordReset(
            tokenHash: $tokenHash,
            adminUserId: $this->adminId,
            expiresAt: '2026-06-15 13:00:00', // 固定 now の1時間後（有効）
            usedAt: null,
            createdAt: gmdate('Y-m-d H:i:s'),
        ));

        $this->useCase->execute($rawToken, 'new-password-ok');

        // 同一トークンを使おうとすると拒否される
        $this->expectException(InvalidPasswordResetTokenException::class);

        $this->useCase->execute($rawToken, 'another-attempt');
    }

    public function test_execute_succeeds_with_exactly_8_char_password(): void
    {
        // 境界値: 8文字ちょうどは許可される
        $rawToken = 'boundary-token';
        $tokenHash = hash('sha256', $rawToken);

        $this->resets->save(new AdminPasswordReset(
            tokenHash: $tokenHash,
            adminUserId: $this->adminId,
            expiresAt: '2026-06-15 13:00:00', // 固定 now の1時間後（有効）
            usedAt: null,
            createdAt: gmdate('Y-m-d H:i:s'),
        ));

        $this->useCase->execute($rawToken, '12345678'); // 8文字

        $user = $this->users->findById($this->adminId);
        self::assertNotNull($user);
        self::assertTrue(password_verify('12345678', $user->passwordHash));
    }
}
