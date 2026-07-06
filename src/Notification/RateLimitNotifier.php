<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use Nene2\Http\ClockInterface;
use Nene2\Middleware\RateLimitStorageInterface;
use NeneCorpus\Mail\MailerInterface;
use NeneCorpus\Mail\MailMessage;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

/**
 * Fires a rate-limit-exceeded email to the operator, with cooldown to suppress burst notifications.
 */
final readonly class RateLimitNotifier
{
    private const HITS_KEY_PREFIX = 'notify:ratelimit:hits:';

    private const COOLDOWN_KEY_PREFIX = 'notify:ratelimit:cooldown:';

    public function __construct(
        private MailerInterface $mailer,
        private RateLimitStorageInterface $storage,
        private RequestScopedOrgIdHolder $orgIdHolder,
        private ClockInterface $clock,
    ) {
    }

    /**
     * Call this whenever a 429 response is about to be sent.
     * Silently swallows errors so the chat response is never blocked.
     */
    public function notifyIfNeeded(
        NotificationConfig $config,
        string $toEmail,
        string $ip,
        string $limitScope,
    ): void {
        if (!$config->rateLimitNotifyEnabled || !$this->mailer->isConfigured()) {
            return;
        }

        $orgId = $this->orgIdHolder->getId() ?? 1;

        // Track daily hits regardless of cooldown (org-scoped)
        $today = $this->clock->now()->format('Y-m-d');
        $this->storage->hit(self::HITS_KEY_PREFIX . $orgId . ':' . $today, 86400);

        // Cooldown check — use 1 hit-per-window as the gate (org-scoped)
        $cooldownSeconds = $config->rateLimitCooldownMinutes * 60;
        $result = $this->storage->hit(self::COOLDOWN_KEY_PREFIX . $orgId, $cooldownSeconds);

        if ($result['count'] > 1) {
            // Still inside cooldown window; don't send again
            return;
        }

        try {
            $this->mailer->send(new MailMessage(
                to: $toEmail,
                toName: '',
                subject: '[NeNe Corpus] 利用制限超過アラート',
                textBody: $this->buildText($ip, $limitScope, $cooldownSeconds),
                htmlBody: $this->buildHtml($ip, $limitScope, $cooldownSeconds),
            ));
        } catch (\Throwable) {
            // Never block the HTTP response on mail failure
        }
    }

    private function buildText(string $ip, string $scope, int $cooldownSeconds): string
    {
        $time = $this->clock->now()->format('Y-m-d H:i:s');
        $nextNotify = (int) ($cooldownSeconds / 60);

        return implode("\n", [
            '== NeNe Corpus 利用制限超過アラート ==',
            '',
            '発生日時 : ' . $time,
            '送信元 IP: ' . $ip,
            '制限種別 : ' . $scope,
            '',
            "次回の通知は {$nextNotify} 分後以降に送信されます。",
            '',
            '---',
            'NeNe Corpus 管理画面 > 利用制限 で設定を変更できます。',
        ]);
    }

    private function buildHtml(string $ip, string $scope, int $cooldownSeconds): string
    {
        $time       = htmlspecialchars($this->clock->now()->format('Y-m-d H:i:s'), ENT_QUOTES, 'UTF-8');
        $ip         = htmlspecialchars($ip, ENT_QUOTES, 'UTF-8');
        $scope      = htmlspecialchars($scope, ENT_QUOTES, 'UTF-8');
        $nextNotify = (int) ($cooldownSeconds / 60);

        return <<<HTML
        <!DOCTYPE html>
        <html lang="ja">
        <head><meta charset="UTF-8"><title>利用制限超過アラート</title></head>
        <body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#d97706;border-bottom:2px solid #d97706;padding-bottom:8px">
            ⚠️ NeNe Corpus 利用制限超過アラート
          </h2>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr style="background:#fef3c7">
              <th style="text-align:left;padding:10px 16px;border:1px solid #fde68a;width:40%">項目</th>
              <th style="text-align:left;padding:10px 16px;border:1px solid #fde68a">値</th>
            </tr>
            <tr>
              <td style="padding:10px 16px;border:1px solid #e5e7eb">発生日時</td>
              <td style="padding:10px 16px;border:1px solid #e5e7eb">{$time}</td>
            </tr>
            <tr style="background:#f9fafb">
              <td style="padding:10px 16px;border:1px solid #e5e7eb">送信元 IP</td>
              <td style="padding:10px 16px;border:1px solid #e5e7eb;font-family:monospace">{$ip}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;border:1px solid #e5e7eb">制限種別</td>
              <td style="padding:10px 16px;border:1px solid #e5e7eb">{$scope}</td>
            </tr>
          </table>
          <p style="margin-top:16px;color:#666;font-size:13px">
            次回の通知は <strong>{$nextNotify} 分後</strong>以降に送信されます。
          </p>
          <p style="color:#9ca3af;font-size:12px">
            管理画面 &gt; 設定 &gt; 利用制限 で設定を変更できます。
          </p>
        </body>
        </html>
        HTML;
    }
}
