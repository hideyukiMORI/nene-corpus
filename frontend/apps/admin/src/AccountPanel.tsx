import { FormEvent, useState } from 'react';
import { changeAdminPassword, changeAdminEmail } from '@nene-corpus/api-client/account';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { adminApiBase } from './config';

interface AccountPanelProps {
  token: string;
  /** メールアドレス変更後にヘッダー等を更新するために使う */
  onEmailChanged?: (newEmail: string) => void;
}

// ── パスワード変更フォーム ─────────────────────────────────────────────────

function ChangePasswordForm({ token }: { token: string }) {
  const t = useMsg();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (current === '') {
      setError(t(Msg.admin.account.currentPasswordRequired));
      return;
    }

    if (next.length < 8) {
      setError(t(Msg.admin.account.passwordTooShort));
      return;
    }

    if (next !== confirm) {
      setError(t(Msg.admin.account.passwordMismatch));
      return;
    }

    setSaving(true);
    try {
      await changeAdminPassword(token, { current_password: current, new_password: next }, adminApiBase);
      setSuccess(t(Msg.admin.account.passwordSaveSuccess));
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.common.genericError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-admin border border-border p-4">
      <h3 className="mb-3 font-medium text-fg">{t(Msg.admin.account.passwordSectionTitle)}</h3>
      <form className="space-y-3" onSubmit={(e) => void handleSubmit(e)}>
        <label className="block text-sm">
          <span className="font-medium text-fg">{t(Msg.admin.account.currentPassword)}</span>
          <input
            className="nc-input mt-1"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => { setCurrent(e.target.value); setError(null); }}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-fg">{t(Msg.admin.account.newPassword)}</span>
          <input
            className="nc-input mt-1"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => { setNext(e.target.value); setError(null); }}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-fg">{t(Msg.admin.account.confirmPassword)}</span>
          <input
            className="nc-input mt-1"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(null); }}
          />
        </label>
        <div className="flex items-center gap-3">
          <button className="nc-btn-primary" type="submit" disabled={saving}>
            {saving ? t(Msg.admin.account.saving) : t(Msg.admin.account.savePassword)}
          </button>
        </div>
        {error !== null && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {success !== null && <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p>}
      </form>
    </div>
  );
}

// ── メールアドレス変更フォーム ─────────────────────────────────────────────

function ChangeEmailForm({ token, onEmailChanged }: { token: string; onEmailChanged?: (email: string) => void }) {
  const t = useMsg();
  const [current, setCurrent] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (current === '') {
      setError(t(Msg.admin.account.currentPasswordRequired));
      return;
    }

    setSaving(true);
    try {
      await changeAdminEmail(token, { current_password: current, new_email: newEmail }, adminApiBase);
      setSuccess(t(Msg.admin.account.emailSaveSuccess));
      setCurrent('');
      setNewEmail('');
      onEmailChanged?.(newEmail);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.common.genericError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-admin border border-border p-4">
      <h3 className="mb-3 font-medium text-fg">{t(Msg.admin.account.emailSectionTitle)}</h3>
      <form className="space-y-3" onSubmit={(e) => void handleSubmit(e)}>
        <label className="block text-sm">
          <span className="font-medium text-fg">{t(Msg.admin.account.currentPassword)}</span>
          <input
            className="nc-input mt-1"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => { setCurrent(e.target.value); setError(null); }}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-fg">{t(Msg.admin.account.newEmail)}</span>
          <input
            className="nc-input mt-1"
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(e) => { setNewEmail(e.target.value); setError(null); }}
          />
        </label>
        <div className="flex items-center gap-3">
          <button className="nc-btn-primary" type="submit" disabled={saving}>
            {saving ? t(Msg.admin.account.saving) : t(Msg.admin.account.saveEmail)}
          </button>
        </div>
        {error !== null && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {success !== null && <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p>}
      </form>
    </div>
  );
}

// ── メインコンポーネント ──────────────────────────────────────────────────

export function AccountPanel({ token, onEmailChanged }: AccountPanelProps) {
  return (
    <section className="nc-panel">
      <div className="px-4 pb-5 pt-4 space-y-4">
        <ChangePasswordForm token={token} />
        <ChangeEmailForm token={token} onEmailChanged={onEmailChanged} />
      </div>
    </section>
  );
}
