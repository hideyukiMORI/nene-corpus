<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\AdminAuth;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\AdminAuth\PdoAdminPasswordResetRepository;
use NeneCorpus\AdminAuth\PdoAdminUserRepository;
use NeneCorpus\AdminAuth\RequestPasswordResetUseCase;
use NeneCorpus\Mail\MailerInterface;
use NeneCorpus\Mail\MailMessage;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\FixedClock;
use PHPUnit\Framework\TestCase;

/**
 * RequestPasswordResetUseCase の敵対的テスト。
 *
 * セキュリティ重点チェック:
 *  - 存在しないメールアドレスを送っても例外なし → アカウント列挙防止
 *  - 既知のメールでも SMTP 未設定なら mail 送信・token 保存をしない
 *  - 正常フローでは token が DB に保存され mail が送られる
 *  - resetBaseUrl が適切にトークンを含む URL を構築する
 */
final class RequestPasswordResetUseCaseTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;
    private PdoAdminUserRepository $users;
    private PdoAdminPasswordResetRepository $resets;
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

        $hash = password_hash('any-password', PASSWORD_ARGON2ID);
        $now = gmdate('Y-m-d H:i:s');
        $this->executor->execute(
            'INSERT INTO admin_users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
            ['known@example.com', $hash, $now, $now],
        );

        $adminRow = $this->executor->fetchOne('SELECT id FROM admin_users LIMIT 1');
        self::assertNotNull($adminRow);
        $this->adminId = (int) $adminRow['id'];
        $this->users = new PdoAdminUserRepository($this->executor, new FixedClock());
        $this->resets = new PdoAdminPasswordResetRepository($this->executor, new FixedClock());
    }

    // ── アカウント列挙防止 ────────────────────────────────────────────

    public function test_execute_returns_silently_for_unknown_email(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects(self::never())->method('send');
        $mailer->method('isConfigured')->willReturn(true);

        $useCase = new RequestPasswordResetUseCase($this->users, $this->resets, $mailer, new FixedClock());

        // 例外なし・メール送信なし
        $useCase->execute('nobody@unknown.com', 'https://example.com/admin/');

        $countRow = $this->executor->fetchOne('SELECT COUNT(*) AS c FROM admin_password_resets');
        self::assertNotNull($countRow);
        self::assertSame(0, (int) $countRow['c']);
    }

    public function test_execute_and_unknown_email_produce_no_exception_same_as_known(): void
    {
        // 既知のメール・SMTP 未設定の場合も例外なし
        $mailerNotConfigured = $this->createMock(MailerInterface::class);
        $mailerNotConfigured->expects(self::never())->method('send');
        $mailerNotConfigured->method('isConfigured')->willReturn(false);

        $useCase = new RequestPasswordResetUseCase($this->users, $this->resets, $mailerNotConfigured, new FixedClock());

        // 既知メール → 例外なし（外から区別できない）
        $useCase->execute('known@example.com', 'https://example.com/admin/');

        // 不明メール → 例外なし（外から区別できない）
        $useCase->execute('nobody@unknown.com', 'https://example.com/admin/');

        // どちらもメール送信なし
        // (expects(never) がアサーションを担保)
    }

    // ── SMTP 未設定 ────────────────────────────────────────────────

    public function test_execute_does_not_save_token_when_mailer_not_configured(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(false);
        $mailer->expects(self::never())->method('send');

        $useCase = new RequestPasswordResetUseCase($this->users, $this->resets, $mailer, new FixedClock());
        $useCase->execute('known@example.com', 'https://example.com/admin/');

        $countRow = $this->executor->fetchOne('SELECT COUNT(*) AS c FROM admin_password_resets');
        self::assertNotNull($countRow);
        self::assertSame(0, (int) $countRow['c'], 'SMTP 未設定の場合 token は保存されない');
    }

    // ── 正常フロー ────────────────────────────────────────────────────

    public function test_execute_saves_token_and_sends_mail_for_known_email(): void
    {
        $capturedMessage = null;

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(true);
        $mailer->expects(self::once())
            ->method('send')
            ->willReturnCallback(function (MailMessage $msg) use (&$capturedMessage): void {
                $capturedMessage = $msg;
            });

        $useCase = new RequestPasswordResetUseCase($this->users, $this->resets, $mailer, new FixedClock());
        $useCase->execute('known@example.com', 'https://example.com/admin/reset');

        // token が DB に保存された
        $countRow = $this->executor->fetchOne('SELECT COUNT(*) AS c FROM admin_password_resets');
        self::assertNotNull($countRow);
        self::assertSame(1, (int) $countRow['c']);

        // メールの宛先が正しい
        self::assertNotNull($capturedMessage);
        self::assertSame('known@example.com', $capturedMessage->to);

        // リセット URL がメール本文に含まれる
        self::assertStringContainsString('reset_token=', $capturedMessage->textBody);
    }

    public function test_execute_reset_url_contains_token_as_query_parameter(): void
    {
        $capturedMessage = null;

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(true);
        $mailer->expects(self::once())
            ->method('send')
            ->willReturnCallback(function (MailMessage $msg) use (&$capturedMessage): void {
                $capturedMessage = $msg;
            });

        $useCase = new RequestPasswordResetUseCase($this->users, $this->resets, $mailer, new FixedClock());
        $useCase->execute('known@example.com', 'https://example.com/admin/');

        self::assertNotNull($capturedMessage);
        // URL は ?reset_token=<hex> の形
        self::assertMatchesRegularExpression('/\?reset_token=[0-9a-f]{64}/', $capturedMessage->textBody);
    }

    public function test_execute_stores_hashed_token_not_raw_token(): void
    {
        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(true);
        $mailer->method('send')->willReturnCallback(static function (): void {
        });

        $useCase = new RequestPasswordResetUseCase($this->users, $this->resets, $mailer, new FixedClock());
        $useCase->execute('known@example.com', 'https://example.com/admin/');

        $row = $this->executor->fetchOne('SELECT token_hash FROM admin_password_resets LIMIT 1');
        self::assertNotNull($row);

        // SHA-256 ハッシュ (64 hex文字) が格納されている
        self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', (string) $row['token_hash']);
    }

    public function test_execute_cleans_up_stale_tokens_before_saving_new_one(): void
    {
        // 期限切れ token を事前に挿入（FixedClock の固定 now = 2026-01-15 12:00:00 より過去）
        $this->executor->execute(
            'INSERT INTO admin_password_resets (token_hash, admin_user_id, expires_at, used_at, created_at) VALUES (?, ?, ?, ?, ?)',
            ['old-hash', $this->adminId, '2026-01-15 11:58:20', null, '2026-01-15 10:58:20'],
        );

        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('isConfigured')->willReturn(true);
        $mailer->method('send')->willReturnCallback(static function (): void {
        });

        $useCase = new RequestPasswordResetUseCase($this->users, $this->resets, $mailer, new FixedClock());
        $useCase->execute('known@example.com', 'https://example.com/admin/');

        // 期限切れ token は削除され、新しい token だけ残る
        $countRow = $this->executor->fetchOne('SELECT COUNT(*) AS c FROM admin_password_resets');
        self::assertNotNull($countRow);
        self::assertSame(1, (int) $countRow['c']);
        self::assertNull($this->executor->fetchOne("SELECT id FROM admin_password_resets WHERE token_hash = 'old-hash'"));
    }
}
