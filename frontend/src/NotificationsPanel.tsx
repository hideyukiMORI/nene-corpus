import { useEffect, useState } from 'react';
import { Msg, useMsg } from '@/shared/i18n';
import {
  type NotificationSettings,
  getNotificationSettings,
  updateNotificationSettings,
  sendTestMail,
} from '@/shared/api/notifications';
import { adminApiBase } from './config';

interface NotificationsPanelProps {
  token: string;
}

export function NotificationsPanel({ token }: NotificationsPanelProps) {
  const t = useMsg();

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form fields
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpEncryption, setSmtpEncryption] = useState<'tls' | 'ssl' | 'none'>('tls');
  const [smtpFromAddress, setSmtpFromAddress] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [rateLimitEnabled, setRateLimitEnabled] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(60);
  const [dailyReportEnabled, setDailyReportEnabled] = useState(false);
  const [regenerateToken, setRegenerateToken] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getNotificationSettings(token, adminApiBase)
      .then((s) => {
        setSettings(s);
        setSmtpHost(s.smtp_host);
        setSmtpPort(s.smtp_port);
        setSmtpUsername(s.smtp_username);
        setSmtpEncryption(s.smtp_encryption);
        setSmtpFromAddress(s.smtp_from_address);
        setSmtpFromName(s.smtp_from_name);
        setNotifyEmail(s.notify_email);
        setRateLimitEnabled(s.rate_limit_notify_enabled);
        setRateLimitCooldown(s.rate_limit_cooldown_minutes);
        setDailyReportEnabled(s.daily_report_enabled);
        setTestEmail(s.notify_email);
      })
      .catch(() => setLoadError(t(Msg.admin.notifications.loadFailed)));
  }, [token, t]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await updateNotificationSettings(
        token,
        {
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_username: smtpUsername,
          smtp_password: smtpPassword !== '' ? smtpPassword : null,
          smtp_encryption: smtpEncryption,
          smtp_from_address: smtpFromAddress,
          smtp_from_name: smtpFromName,
          notify_email: notifyEmail,
          rate_limit_notify_enabled: rateLimitEnabled,
          rate_limit_cooldown_minutes: rateLimitCooldown,
          daily_report_enabled: dailyReportEnabled,
          regenerate_daily_report_token: regenerateToken,
        },
        adminApiBase,
      );
      setSettings(updated);
      setSmtpPassword('');
      setRegenerateToken(false);
      setSaveMsg({ ok: true, text: t(Msg.admin.notifications.saveSuccess) });
    } catch {
      setSaveMsg({ ok: false, text: t(Msg.admin.notifications.saveFailed) });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestMail() {
    if (!testEmail) return;
    setTestSending(true);
    setTestMsg(null);
    try {
      await sendTestMail(token, testEmail, adminApiBase);
      setTestMsg({ ok: true, text: t(Msg.admin.notifications.testMailSuccess) });
    } catch (err) {
      setTestMsg({ ok: false, text: `${t(Msg.admin.notifications.testMailFailed)}: ${err instanceof Error ? err.message : ''}` });
    } finally {
      setTestSending(false);
    }
  }

  const dailyReportUrl = settings?.daily_report_token
    ? `${window.location.origin}/admin/notifications/daily-report?token=${settings.daily_report_token}`
    : '';

  if (loadError) {
    return (
      <section className="nc-panel">
        <p className="px-4 py-4 text-sm text-red-500">{loadError}</p>
      </section>
    );
  }

  if (!settings) {
    return (
      <section className="nc-panel">
        <p className="px-4 py-4 nc-text-muted text-sm">{t(Msg.common.loading)}</p>
      </section>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <section className="nc-panel space-y-6 px-4 pb-6 pt-4">

        {/* ── SMTP 設定 ── */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-fg">{t(Msg.admin.notifications.smtpSection)}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="nc-label">{t(Msg.admin.notifications.smtpHost)}</label>
              <input
                type="text"
                className="nc-input mt-1 w-full"
                placeholder="smtp.example.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
              />
            </div>
            <div>
              <label className="nc-label">{t(Msg.admin.notifications.smtpPort)}</label>
              <input
                type="number"
                className="nc-input mt-1 w-full"
                min={1}
                max={65535}
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="nc-label">{t(Msg.admin.notifications.smtpUsername)}</label>
              <input
                type="text"
                className="nc-input mt-1 w-full"
                autoComplete="username"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="nc-label">{t(Msg.admin.notifications.smtpPassword)}</label>
              <input
                type="password"
                className="nc-input mt-1 w-full"
                autoComplete="new-password"
                placeholder={settings.smtp_password_set ? t(Msg.admin.notifications.smtpPasswordPlaceholder) : ''}
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="nc-label">{t(Msg.admin.notifications.smtpEncryption)}</label>
              <select
                className="nc-input mt-1 w-full"
                value={smtpEncryption}
                onChange={(e) => setSmtpEncryption(e.target.value as 'tls' | 'ssl' | 'none')}
              >
                <option value="tls">TLS (STARTTLS)</option>
                <option value="ssl">SSL/TLS</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="nc-label">{t(Msg.admin.notifications.smtpFromAddress)}</label>
              <input
                type="email"
                className="nc-input mt-1 w-full"
                value={smtpFromAddress}
                onChange={(e) => setSmtpFromAddress(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="nc-label">{t(Msg.admin.notifications.smtpFromName)}</label>
              <input
                type="text"
                className="nc-input mt-1 w-full"
                value={smtpFromName}
                onChange={(e) => setSmtpFromName(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="nc-label">{t(Msg.admin.notifications.notifyEmail)}</label>
              <input
                type="email"
                className="nc-input mt-1 w-full"
                placeholder="operator@example.com"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
              />
              <p className="mt-1 text-xs nc-text-muted">{t(Msg.admin.notifications.notifyEmailHelp)}</p>
            </div>
          </div>
        </div>

        {/* ── 利用制限アラート ── */}
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold text-fg">{t(Msg.admin.notifications.rateLimitSection)}</h3>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="rounded"
              checked={rateLimitEnabled}
              onChange={(e) => setRateLimitEnabled(e.target.checked)}
            />
            {t(Msg.admin.notifications.rateLimitEnabled)}
          </label>
          {rateLimitEnabled && (
            <div className="mt-3 flex items-center gap-2">
              <label className="nc-label shrink-0">{t(Msg.admin.notifications.rateLimitCooldown)}</label>
              <input
                type="number"
                className="nc-input w-24"
                min={1}
                value={rateLimitCooldown}
                onChange={(e) => setRateLimitCooldown(Number(e.target.value))}
              />
              <span className="text-sm nc-text-muted">{t(Msg.admin.notifications.rateLimitCooldownUnit)}</span>
            </div>
          )}
        </div>

        {/* ── 日次レポート ── */}
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold text-fg">{t(Msg.admin.notifications.dailyReportSection)}</h3>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="rounded"
              checked={dailyReportEnabled}
              onChange={(e) => setDailyReportEnabled(e.target.checked)}
            />
            {t(Msg.admin.notifications.dailyReportEnabled)}
          </label>
          {dailyReportEnabled && settings.daily_report_token && (
            <div className="mt-3 space-y-2">
              <p className="text-xs nc-text-muted">{t(Msg.admin.notifications.dailyReportTokenLabel)}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-surface-hover px-3 py-2 text-xs break-all font-mono">
                  {dailyReportUrl}
                </code>
                <button
                  type="button"
                  className="nc-btn shrink-0 text-xs"
                  onClick={() => navigator.clipboard.writeText(dailyReportUrl)}
                >
                  Copy
                </button>
              </div>
              <p className="text-xs nc-text-muted">{t(Msg.admin.notifications.dailyReportCronExample)}: <code className="font-mono">0 8 * * * curl -s "{dailyReportUrl}"</code></p>
              <label className="flex items-center gap-2 text-xs nc-text-muted">
                <input
                  type="checkbox"
                  checked={regenerateToken}
                  onChange={(e) => setRegenerateToken(e.target.checked)}
                />
                {t(Msg.admin.notifications.regenerateToken)}
              </label>
            </div>
          )}
        </div>

        {/* ── 保存ボタン ── */}
        <div className="border-t border-border pt-4 flex items-center gap-3">
          <button
            type="submit"
            className="nc-btn nc-btn-primary"
            disabled={saving}
          >
            {saving ? t(Msg.admin.notifications.saving) : t(Msg.admin.notifications.save)}
          </button>
          {saveMsg && (
            <span className={`text-sm ${saveMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {saveMsg.text}
            </span>
          )}
        </div>

        {/* ── テスト送信 ── */}
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold text-fg">{t(Msg.admin.notifications.testMailSection)}</h3>
          {!settings.smtp_configured && (
            <p className="mb-3 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded px-3 py-2">
              {t(Msg.admin.notifications.smtpNotConfiguredWarning)}
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="email"
              className="nc-input flex-1"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <button
              type="button"
              className="nc-btn shrink-0"
              disabled={testSending || !settings.smtp_configured || !testEmail}
              onClick={handleTestMail}
            >
              {testSending ? t(Msg.admin.notifications.testMailSending) : t(Msg.admin.notifications.testMailButton)}
            </button>
          </div>
          {testMsg && (
            <p className={`mt-2 text-sm ${testMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {testMsg.text}
            </p>
          )}
        </div>

      </section>
    </form>
  );
}
