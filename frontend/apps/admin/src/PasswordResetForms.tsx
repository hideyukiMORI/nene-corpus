import { type FormEvent, useState } from 'react';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { confirmPasswordReset, requestPasswordReset } from '@nene-corpus/api-client';
import { adminApiBase } from './config';

// ─── Request form ────────────────────────────────────────────────────────────

interface PasswordResetRequestFormProps {
  onBack: () => void;
}

export function PasswordResetRequestForm({ onBack }: PasswordResetRequestFormProps) {
  const t = useMsg();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email, adminApiBase);
      setSubmitted(true);
    } catch {
      // Always show success to prevent enumeration
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="nc-panel mx-auto max-w-md p-6">
        <h2 className="text-lg font-medium">{t(Msg.admin.passwordReset.requestTitle)}</h2>
        <p className="mt-3 text-sm">{t(Msg.admin.passwordReset.requestSuccess)}</p>
        <button
          className="mt-4 nc-btn-primary w-full"
          type="button"
          onClick={onBack}
        >
          {t(Msg.admin.passwordReset.backToLogin)}
        </button>
      </section>
    );
  }

  return (
    <section className="nc-panel mx-auto max-w-md p-6">
      <h2 className="text-lg font-medium">{t(Msg.admin.passwordReset.requestTitle)}</h2>
      <p className="mt-1 nc-text-muted">{t(Msg.admin.passwordReset.requestSubtitle)}</p>
      <form className="mt-4 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block text-sm">
          <span className="font-medium text-fg">{t(Msg.admin.auth.email)}</span>
          <input
            className="nc-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <button className="nc-btn-primary w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t(Msg.admin.passwordReset.requestSubmitting)
            : t(Msg.admin.passwordReset.requestSubmit)}
        </button>
        <button
          className="nc-btn w-full"
          type="button"
          onClick={onBack}
        >
          {t(Msg.admin.passwordReset.backToLogin)}
        </button>
      </form>
    </section>
  );
}

// ─── Confirm form ─────────────────────────────────────────────────────────────

interface PasswordResetConfirmFormProps {
  rawToken: string;
  onBack: () => void;
}

export function PasswordResetConfirmForm({ rawToken, onBack }: PasswordResetConfirmFormProps) {
  const t = useMsg();
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await confirmPasswordReset(rawToken, password, adminApiBase);
      setSucceeded(true);
      // Remove ?reset_token from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('reset_token');
      window.history.replaceState({}, '', url.toString());
    } catch {
      setError(t(Msg.admin.passwordReset.tokenInvalid));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <section className="nc-panel mx-auto max-w-md p-6">
        <h2 className="text-lg font-medium">{t(Msg.admin.passwordReset.confirmTitle)}</h2>
        <p className="mt-3 text-sm text-green-600">{t(Msg.admin.passwordReset.confirmSuccess)}</p>
        <button
          className="mt-4 nc-btn-primary w-full"
          type="button"
          onClick={onBack}
        >
          {t(Msg.admin.passwordReset.backToLogin)}
        </button>
      </section>
    );
  }

  return (
    <section className="nc-panel mx-auto max-w-md p-6">
      <h2 className="text-lg font-medium">{t(Msg.admin.passwordReset.confirmTitle)}</h2>
      <p className="mt-1 nc-text-muted">{t(Msg.admin.passwordReset.confirmSubtitle)}</p>
      <form className="mt-4 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block text-sm">
          <span className="font-medium text-fg">{t(Msg.admin.passwordReset.newPassword)}</span>
          <input
            className="nc-input"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error !== null && <p className="text-sm text-red-600">{error}</p>}
        <button className="nc-btn-primary w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t(Msg.admin.passwordReset.confirmSubmitting)
            : t(Msg.admin.passwordReset.confirmSubmit)}
        </button>
        <button
          className="nc-btn w-full"
          type="button"
          onClick={onBack}
        >
          {t(Msg.admin.passwordReset.backToLogin)}
        </button>
      </form>
    </section>
  );
}
