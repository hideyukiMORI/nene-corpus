<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use NeneCorpus\Mail\MailerInterface;
use NeneCorpus\Mail\MailMessage;
use NeneCorpus\Mail\MailSendException;

final readonly class SendDailyReportUseCase
{
    public function __construct(
        private MailerInterface $mailer,
        private DailyReportRepositoryInterface $reportRepository,
    ) {
    }

    /**
     * @throws NotificationException
     * @throws MailSendException
     */
    public function execute(string $toEmail, ?string $date = null): DailyReportStats
    {
        if (!$this->mailer->isConfigured()) {
            throw new NotificationException('SMTP is not configured.');
        }

        $date  = $date ?? date('Y-m-d');
        $stats = $this->reportRepository->getStats($date);

        $subject = sprintf('[NeNe Corpus] 日次チャットレポート %s', $date);

        $text = $this->buildTextBody($stats);
        $html = $this->buildHtmlBody($stats);

        $this->mailer->send(new MailMessage(
            to: $toEmail,
            toName: '',
            subject: $subject,
            textBody: $text,
            htmlBody: $html,
        ));

        return $stats;
    }

    private function buildTextBody(DailyReportStats $stats): string
    {
        return implode("\n", [
            '== NeNe Corpus 日次チャットレポート ==',
            '',
            '対象日: ' . $stats->reportDate,
            '',
            '■ 統計',
            '  セッション数 : ' . $stats->totalSessions,
            'メッセージ数 : ' . $stats->totalMessages,
            'ユニーク IP  : ' . $stats->uniqueIps,
            '利用制限ヒット: ' . $stats->rateLimitHits,
            '',
            '---',
            'NeNe Corpus — https://github.com/hideyukiMORI/nene-corpus',
        ]);
    }

    private function buildHtmlBody(DailyReportStats $stats): string
    {
        $date     = htmlspecialchars($stats->reportDate, ENT_QUOTES, 'UTF-8');
        $sessions = $stats->totalSessions;
        $messages = $stats->totalMessages;
        $ips      = $stats->uniqueIps;
        $limits   = $stats->rateLimitHits;

        return <<<HTML
        <!DOCTYPE html>
        <html lang="ja">
        <head><meta charset="UTF-8"><title>日次チャットレポート</title></head>
        <body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#2563eb;border-bottom:2px solid #2563eb;padding-bottom:8px">
            NeNe Corpus 日次チャットレポート
          </h2>
          <p style="color:#666">対象日: <strong>{$date}</strong></p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr style="background:#f3f4f6">
              <th style="text-align:left;padding:10px 16px;border:1px solid #e5e7eb">項目</th>
              <th style="text-align:right;padding:10px 16px;border:1px solid #e5e7eb">件数</th>
            </tr>
            <tr>
              <td style="padding:10px 16px;border:1px solid #e5e7eb">セッション数</td>
              <td style="text-align:right;padding:10px 16px;border:1px solid #e5e7eb;font-weight:bold">{$sessions}</td>
            </tr>
            <tr style="background:#f9fafb">
              <td style="padding:10px 16px;border:1px solid #e5e7eb">メッセージ数</td>
              <td style="text-align:right;padding:10px 16px;border:1px solid #e5e7eb;font-weight:bold">{$messages}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;border:1px solid #e5e7eb">ユニーク IP 数</td>
              <td style="text-align:right;padding:10px 16px;border:1px solid #e5e7eb;font-weight:bold">{$ips}</td>
            </tr>
            <tr style="background:#fef3c7">
              <td style="padding:10px 16px;border:1px solid #e5e7eb">利用制限ヒット数</td>
              <td style="text-align:right;padding:10px 16px;border:1px solid #e5e7eb;font-weight:bold;color:#d97706">{$limits}</td>
            </tr>
          </table>
          <p style="margin-top:24px;color:#9ca3af;font-size:12px">
            NeNe Corpus — <a href="https://github.com/hideyukiMORI/nene-corpus">github.com/hideyukiMORI/nene-corpus</a>
          </p>
        </body>
        </html>
        HTML;
    }
}
