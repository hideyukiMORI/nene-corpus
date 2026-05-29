/**
 * LoginPage — v2 リデザイン実装 (#260)
 * auth-shell の 2 カラム構成。シェル（Topbar/Sidebar）は使わない。
 */
import { type FormEvent, useEffect, useState } from 'react';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { confirmPasswordReset, requestPasswordReset } from '@nene-corpus/api-client';
import { adminApiBase } from '../../config';
import { useAdminTheme } from '../../ThemeProvider';
import { useNavigate } from '../router';

type LoginView = 'login' | 'reset-request' | 'reset-confirm';

function resolveInitialView(): LoginView {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset_token')) return 'reset-confirm';
  } catch {
    // ignore
  }
  return 'login';
}

// ── アイコン SVG ─────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'auth-spin 0.7s linear infinite', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"/>
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success-fg)" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

// ── ブランドヘッダー（auth-card 上部に常時表示） ──────────────────────────────

function BrandHeader() {
  return (
    <div className="auth-brand">
      <div className="brand-mark">n</div>
      <div className="stack">
        <span className="name">
          NeNe <span className="dim">Corpus</span>
        </span>
        <span className="role">Admin</span>
      </div>
    </div>
  );
}

// ── テーマトグル（フローティング） ────────────────────────────────────────────

function AuthThemeToggle() {
  const { theme, toggleTheme } = useAdminTheme();

  return (
    <div className="auth-toptoggle">
      <div className="auth-theme-toggle">
        <button
          className={theme === 'light' ? 'on' : ''}
          onClick={toggleTheme}
          aria-label="ライトモード"
          type="button"
        >
          <SunIcon />
        </button>
        <button
          className={theme === 'dark' ? 'on' : ''}
          onClick={toggleTheme}
          aria-label="ダークモード"
          type="button"
        >
          <MoonIcon />
        </button>
      </div>
    </div>
  );
}

// ── ログインフォーム ───────────────────────────────────────────────────────────

interface LoginFormProps {
  onForgotPassword: () => void;
  /** App（認証状態の所有者）から渡されるログイン関数 */
  onLogin: (email: string, password: string) => Promise<void>;
  /** App の認証エラー state */
  error: string | null;
}

function LoginForm({ onForgotPassword, onLogin, error }: LoginFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      // App 所有の認証状態を更新する（独自インスタンスを作らない）
      await onLogin(email, password);
      navigate('/dashboard');
    } catch {
      // エラーは App の error state（props.error）に入る
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="auth-heading">
        管理画面にログイン <span className="en">// welcome back</span>
      </h1>
      <p className="auth-subheading">
        運営者のアカウントでサインインしてください。
      </p>

      {error !== null && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="signin-field">
          <label className="auth-field-label" htmlFor="auth-email">
            メールアドレス <span className="en">// email</span>
          </label>
          <input
            id="auth-email"
            className="auth-field-input"
            type="email"
            autoFocus
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="signin-field">
          <label className="auth-field-label" htmlFor="auth-password" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span>
              パスワード <span className="en">// password</span>
            </span>
            <button
              type="button"
              className="auth-forgot-link"
              onClick={onForgotPassword}
            >
              パスワードをお忘れの場合 →
            </button>
          </label>
          <input
            id="auth-password"
            className="auth-field-input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="auth-remember">
          <input
            id="auth-remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <label htmlFor="auth-remember">このブラウザを記憶する</label>
        </div>

        <button
          className="auth-btn-primary"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <SpinnerIcon />
              サインイン中...
            </>
          ) : (
            'サインイン'
          )}
        </button>
      </form>
    </>
  );
}

// ── パスワード再設定（リクエスト） ──────────────────────────────────────────────

interface ResetFormProps {
  onBack: () => void;
}

function ResetRequestForm({ onBack }: ResetFormProps) {
  const t = useMsg();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email, adminApiBase);
    } catch {
      // 列挙攻撃を防ぐため、失敗時も成功表示にする
    } finally {
      setSubmitted(true);
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="auth-heading">{t(Msg.admin.passwordReset.requestTitle)}</h1>
      <p className="auth-subheading">{t(Msg.admin.passwordReset.requestSubtitle)}</p>

      {submitted ? (
        <div className="auth-notice auth-notice-success" role="status">
          <CheckCircleIcon />
          <div>{t(Msg.admin.passwordReset.requestSuccess)}</div>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="signin-field">
            <label className="auth-field-label" htmlFor="reset-email">
              メールアドレス <span className="en">// email</span>
            </label>
            <input
              id="reset-email"
              className="auth-field-input"
              type="email"
              autoFocus
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <button className="auth-btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <SpinnerIcon />
                {t(Msg.admin.passwordReset.requestSubmitting)}
              </>
            ) : (
              t(Msg.admin.passwordReset.requestSubmit)
            )}
          </button>
        </form>
      )}

      <button type="button" className="auth-link" onClick={onBack}>
        ← {t(Msg.admin.passwordReset.backToLogin)}
      </button>
    </>
  );
}

// ── パスワード再設定（新パスワード設定 / reset_token 経由） ───────────────────────

interface ResetConfirmFormProps {
  rawToken: string;
  onBack: () => void;
}

function ResetConfirmForm({ rawToken, onBack }: ResetConfirmFormProps) {
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
      // URL から ?reset_token を除去（リロードなし）
      const url = new URL(window.location.href);
      url.searchParams.delete('reset_token');
      window.history.replaceState({}, '', url.toString());
    } catch {
      setError(t(Msg.admin.passwordReset.tokenInvalid));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="auth-heading">{t(Msg.admin.passwordReset.confirmTitle)}</h1>
      <p className="auth-subheading">{t(Msg.admin.passwordReset.confirmSubtitle)}</p>

      {succeeded ? (
        <div className="auth-notice auth-notice-success" role="status">
          <CheckCircleIcon />
          <div>{t(Msg.admin.passwordReset.confirmSuccess)}</div>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          {error !== null && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          <div className="signin-field">
            <label className="auth-field-label" htmlFor="reset-newpw">
              {t(Msg.admin.passwordReset.newPassword)} <span className="en">// new password</span>
            </label>
            <input
              id="reset-newpw"
              className="auth-field-input"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <button className="auth-btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <SpinnerIcon />
                {t(Msg.admin.passwordReset.confirmSubmitting)}
              </>
            ) : (
              t(Msg.admin.passwordReset.confirmSubmit)
            )}
          </button>
        </form>
      )}

      <button type="button" className="auth-link" onClick={onBack}>
        ← {t(Msg.admin.passwordReset.backToLogin)}
      </button>
    </>
  );
}

// ── サイドパネル ──────────────────────────────────────────────────────────────

function AuthSide() {
  return (
    <aside className="auth-side">
      <div>
        <div className="auth-side-head">NeNe Corpus · v0.4</div>
        <h2>商品情報を、信頼できる回答に。</h2>
        <p>
          PDF・CSV・テキストをアップロードして、出典付きのチャット回答を自社サイトに埋め込めます。
          共有ホスティング（Tier A / PHP）でも VPS（Tier B）でも動く同一コードベースの OSS。
        </p>

        <div className="auth-feature-list">
          <div className="auth-feature">
            <div className="auth-feature-ic">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M3 5v6a9 3 0 0 0 18 0V5"/>
                <path d="M3 11v6a9 3 0 0 0 18 0v-6"/>
              </svg>
            </div>
            <div className="auth-feature-txt">
              <div className="t">資料を入れるだけ</div>
              <div className="d">
                商品カタログ PDF や FAQ CSV をアップロード。チャンク化と埋め込みは自動。
              </div>
            </div>
          </div>

          <div className="auth-feature">
            <div className="auth-feature-ic">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="auth-feature-txt">
              <div className="t">引用付きで回答</div>
              <div className="d">
                Claude が資料から該当箇所を引いて、引用 ID 付きでエンドユーザに回答します。
              </div>
            </div>
          </div>

          <div className="auth-feature">
            <div className="auth-feature-ic">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <div className="auth-feature-txt">
              <div className="t">スニペット 1 行で埋め込み</div>
              <div className="d">
                既存サイトの <code className="auth-inline-code">&lt;/body&gt;</code> に script タグを 1 つ貼るだけ。
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-side-footer">
        MIT License · open-source · github.com/hideyukiMORI/nene-corpus
      </div>
    </aside>
  );
}

// ── メインエクスポート ─────────────────────────────────────────────────────────

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  authError?: string | null;
}

export function LoginPage({ onLogin, authError = null }: LoginPageProps) {
  const [view, setView] = useState<LoginView>(resolveInitialView);

  // URL に reset_token が無くなったら login ビューへ戻す
  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('reset_token') && view === 'reset-confirm') {
        setView('login');
      }
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  function handleBack() {
    setView('login');
  }

  const rawToken = (() => {
    try {
      return new URLSearchParams(window.location.search).get('reset_token') ?? '';
    } catch {
      return '';
    }
  })();

  return (
    <>
      <AuthThemeToggle />
      <div className="auth-shell">
        {/* サインインペイン */}
        <div className="auth-pane">
          <div className="auth-card">
            <BrandHeader />
            {view === 'login' && (
              <LoginForm
                onForgotPassword={() => setView('reset-request')}
                onLogin={onLogin}
                error={authError}
              />
            )}
            {view === 'reset-request' && <ResetRequestForm onBack={handleBack} />}
            {view === 'reset-confirm' && (
              <ResetConfirmForm rawToken={rawToken} onBack={handleBack} />
            )}
          </div>
        </div>

        {/* 商品紹介サイドパネル（≥880px のみ表示） */}
        <AuthSide />
      </div>
    </>
  );
}
