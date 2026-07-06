<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Http\ClockInterface;
use NeneCorpus\Mail\MailerInterface;
use NeneCorpus\Mail\MailMessage;

final readonly class RequestPasswordResetUseCase implements RequestPasswordResetUseCaseInterface
{
    /** Reset token TTL in seconds (1 hour). */
    private const TOKEN_TTL_SECONDS = 3600;

    public function __construct(
        private AdminUserRepositoryInterface $users,
        private AdminPasswordResetRepositoryInterface $resets,
        private MailerInterface $mailer,
        private ClockInterface $clock,
    ) {
    }

    public function execute(string $email, string $resetBaseUrl): void
    {
        // Clean up stale tokens before issuing a new one
        $this->resets->deleteExpiredAndUsed();

        $user = $this->users->findByEmail($email);

        // Always return normally regardless of whether the email exists
        // to prevent account enumeration.
        if ($user === null || $user->id === null) {
            return;
        }

        if (!$this->mailer->isConfigured()) {
            // SMTP not set up — silently skip; the UI shows a generic success message
            return;
        }

        $rawToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $rawToken);
        $now = $this->clock->now()->format('Y-m-d H:i:s');
        $expiresAt = gmdate('Y-m-d H:i:s', $this->clock->now()->getTimestamp() + self::TOKEN_TTL_SECONDS);

        $this->resets->save(new AdminPasswordReset(
            tokenHash: $tokenHash,
            adminUserId: $user->id,
            expiresAt: $expiresAt,
            usedAt: null,
            createdAt: $now,
        ));

        $resetUrl = rtrim($resetBaseUrl, '/') . '?reset_token=' . urlencode($rawToken);
        $expiryLabel = '1 hour / 1時間';

        $this->mailer->send(new MailMessage(
            to: $user->email,
            toName: '',
            subject: '[NeNe Corpus] パスワードリセット / Password Reset',
            textBody: implode("\n\n", [
                'NeNe Corpus 管理画面のパスワードリセットをリクエストしました。',
                '以下のリンクをクリックして新しいパスワードを設定してください（有効期限: ' . $expiryLabel . '）:',
                $resetUrl,
                '---',
                'A password reset was requested for your NeNe Corpus admin account.',
                'Click the link below to set a new password (expires in ' . $expiryLabel . '):',
                $resetUrl,
                '---',
                'このメールに心当たりがない場合は無視してください。',
                'If you did not request this, please ignore this email.',
            ]),
            htmlBody: '<p>NeNe Corpus 管理画面のパスワードリセットをリクエストしました。</p>'
                . '<p><a href="' . htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8') . '">パスワードをリセットする</a>'
                . '（有効期限: ' . htmlspecialchars($expiryLabel, ENT_QUOTES, 'UTF-8') . '）</p>'
                . '<hr>'
                . '<p>A password reset was requested for your NeNe Corpus admin account.</p>'
                . '<p><a href="' . htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8') . '">Reset your password</a>'
                . ' (expires in ' . htmlspecialchars($expiryLabel, ENT_QUOTES, 'UTF-8') . ')</p>'
                . '<hr>'
                . '<p style="color:#888;font-size:0.85em">このメールに心当たりがない場合は無視してください。'
                . ' / If you did not request this, please ignore this email.</p>',
        ));
    }
}
