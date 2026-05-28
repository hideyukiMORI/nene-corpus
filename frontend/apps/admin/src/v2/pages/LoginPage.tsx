/**
 * LoginPage — v2 placeholder
 * シェル無し・中央カード。実装は #260 で行う。
 */

interface LoginPageProps {
  onLogin?: (email: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin: _onLogin }: LoginPageProps) {
  return (
    <div className="auth-shell">
      <div className="auth-pane">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="brand-mark">n</div>
            <div className="stack">
              <div className="name">
                NeNe <span className="dim">Corpus</span>
              </div>
              <div className="role">Admin</div>
            </div>
          </div>
          <div className="page-head" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 12 }}>
            <div>
              <div className="eyebrow">// login</div>
              <h1 style={{ fontSize: 20 }}>ログイン</h1>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 16 }}>
            LoginPage placeholder — implementing in #260
          </p>
          <div style={{
            background: 'var(--primary-soft)',
            border: '1px solid var(--primary-border)',
            borderRadius: 6,
            padding: '8px 12px',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: 'var(--primary)',
          }}>
            Issue #260 で実装予定
          </div>
        </div>
      </div>
      <div className="auth-side">
        <div>
          <h2>NeNe Corpus</h2>
          <p>引用付き sync JSON chat — 自社ナレッジをコーパスに変える OSS</p>
        </div>
      </div>
    </div>
  );
}
