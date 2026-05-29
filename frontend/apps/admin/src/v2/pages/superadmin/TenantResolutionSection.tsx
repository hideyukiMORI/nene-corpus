/**
 * TenantResolutionSection — テナント解決方式設定 UI (#279)
 * superadmin のみに表示される。
 */
import { FormEvent, useEffect, useState } from 'react';
import { getSystemConfig, updateSystemConfig } from '@nene-corpus/api-client/tenancy';
import type { SystemConfigResponse } from '@nene-corpus/api-client/tenancy';
import { adminApiBase } from '../../../config';

// ─── shared panel/field primitives (copied pattern from SettingsPage) ─────────

interface FormPanelProps {
  title: string;
  titleEn: string;
  lead: React.ReactNode;
  children: React.ReactNode;
}

function FormPanel({ title, titleEn, lead, children }: FormPanelProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--hair)',
      borderRadius: 8,
      padding: '22px 24px 24px',
      marginBottom: 14,
    }}>
      <h3 style={{
        fontSize: 16,
        fontWeight: 700,
        color: 'var(--ink-strong)',
        marginBottom: 4,
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
      }}>
        {title}
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--ink-faint)',
          letterSpacing: '0.04em',
        }}>
          {titleEn}
        </span>
      </h3>
      <div style={{
        fontSize: 13,
        color: 'var(--ink-muted)',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid var(--hair)',
      }}>
        {lead}
      </div>
      {children}
    </div>
  );
}

function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      justifyContent: 'flex-end',
      paddingTop: 18,
      marginTop: 18,
      borderTop: '1px solid var(--hair)',
    }}>
      {children}
    </div>
  );
}

function StatusMsg({ type, text }: { type: 'error' | 'success'; text: string }) {
  return (
    <p style={{
      fontSize: 12.5,
      color: type === 'error' ? 'var(--danger-text)' : 'var(--success-fg)',
      marginTop: 8,
    }}>
      {text}
    </p>
  );
}

// ─── MODES ────────────────────────────────────────────────────────────────────

type TenantResolutionMode = 'single' | 'subdomain' | 'path';

const MODES: { value: TenantResolutionMode; label: string; labelEn: string; description: string }[] = [
  {
    value: 'single',
    label: 'シングルテナント（固定 org）',
    labelEn: 'single',
    description: 'すべてのリクエストを特定の組織に固定する。単一組織の運用に最適。',
  },
  {
    value: 'subdomain',
    label: 'サブドメイン方式',
    labelEn: 'subdomain',
    description: 'acme.example.com のようにサブドメインで組織を判定する。本番 SaaS 向け。',
  },
  {
    value: 'path',
    label: 'パスプレフィックス方式',
    labelEn: 'path',
    description: '/org/acme/... のように URL パスで組織を判定する。DNS 設定不要でシンプル。',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface TenantResolutionSectionProps {
  token: string;
}

export function TenantResolutionSection({ token }: TenantResolutionSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saved, setSaved] = useState<SystemConfigResponse | null>(null);

  // draft values (undefined = not yet edited → fall back to saved)
  const [draftMode, setDraftMode] = useState<TenantResolutionMode | undefined>(undefined);
  const [draftOrgSlug, setDraftOrgSlug] = useState<string | undefined>(undefined);
  const [draftBaseDomain, setDraftBaseDomain] = useState<string | undefined>(undefined);

  const currentMode: TenantResolutionMode = draftMode ?? saved?.tenant_resolution_mode ?? 'single';
  const currentOrgSlug = draftOrgSlug ?? saved?.tenant_org_slug ?? '';
  const currentBaseDomain = draftBaseDomain ?? saved?.tenant_base_domain ?? '';

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getSystemConfig(token, adminApiBase)
      .then((data) => {
        if (!cancelled) {
          setSaved(data);
          setIsLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : '設定の読み込みに失敗しました。');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateSystemConfig(token, {
        tenant_resolution_mode: currentMode,
        tenant_org_slug: currentOrgSlug.trim(),
        tenant_base_domain: currentBaseDomain.trim(),
      }, adminApiBase);
      setSaved(updated);
      setDraftMode(undefined);
      setDraftOrgSlug(undefined);
      setDraftBaseDomain(undefined);
      setSuccess('設定を保存しました。');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : '保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormPanel
      title="テナント解決方式"
      titleEn="// tenant resolution"
      lead="リクエストがどの組織に属するかを判定する方法を選択します。"
    >
      {isLoading ? (
        <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>読み込み中…</p>
      ) : (
        <>
          <form onSubmit={(e) => void handleSubmit(e)}>
            {/* Radio cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {MODES.map((m) => {
                const isSelected = currentMode === m.value;
                return (
                  <label
                    key={m.value}
                    htmlFor={`mode-${m.value}`}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 7,
                      border: isSelected
                        ? '1.5px solid var(--primary)'
                        : '1px solid var(--hair)',
                      background: isSelected ? 'var(--primary-soft)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'border-color 120ms ease, background 120ms ease',
                    }}
                  >
                    <input
                      id={`mode-${m.value}`}
                      type="radio"
                      name="tenant_resolution_mode"
                      value={m.value}
                      checked={isSelected}
                      onChange={() => { setDraftMode(m.value); }}
                      style={{ marginTop: 3, accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-strong)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        {m.label}
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 500, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>
                          // {m.labelEn}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3 }}>
                        {m.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Mode-specific auxiliary input */}
            {currentMode === 'single' && (
              <div className="field" style={{ marginBottom: 16 }}>
                <label className="field-label" htmlFor="tenant-org-slug">
                  組織スラッグ
                  <span className="en">org slug</span>
                </label>
                <input
                  id="tenant-org-slug"
                  className="field-input"
                  type="text"
                  value={currentOrgSlug}
                  onChange={(e) => { setDraftOrgSlug(e.target.value); }}
                  placeholder="my-org"
                  style={{ maxWidth: 280 }}
                />
                <div className="field-hint">すべてのリクエストをこのスラッグの組織に紐付けます。</div>
              </div>
            )}

            {currentMode === 'subdomain' && (
              <div className="field" style={{ marginBottom: 16 }}>
                <label className="field-label" htmlFor="tenant-base-domain">
                  ベースドメイン
                  <span className="en">base domain</span>
                </label>
                <input
                  id="tenant-base-domain"
                  className="field-input"
                  type="text"
                  value={currentBaseDomain}
                  onChange={(e) => { setDraftBaseDomain(e.target.value); }}
                  placeholder="example.com"
                  style={{ maxWidth: 280 }}
                />
                <div className="field-hint">
                  例:{' '}
                  <code style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>example.com</code>
                  {' '}→ リクエストの{' '}
                  <code style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>acme.example.com</code>
                  {' '}から{' '}
                  <code style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>acme</code>
                  {' '}を抽出します。
                </div>
              </div>
            )}

            {currentMode === 'path' && (
              <div style={{
                background: 'var(--bg-soft)',
                border: '1px solid var(--hair)',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 12,
                color: 'var(--ink-muted)',
                marginBottom: 16,
              }}>
                URL の先頭パスセグメントを組織スラッグとして使用します。<br />
                例:{' '}
                <code style={{ fontFamily: '"JetBrains Mono", monospace' }}>/acme/api/v1/…</code>
                {' '}→{' '}
                <code style={{ fontFamily: '"JetBrains Mono", monospace' }}>acme</code>
              </div>
            )}

            {error !== null && <StatusMsg type="error" text={error} />}
            {success !== null && <StatusMsg type="success" text={success} />}

            <FormActions>
              <button className="btn btn-primary" type="submit" disabled={isSaving}>
                {isSaving ? '保存中…' : '設定を保存'}
              </button>
            </FormActions>
          </form>

          {/* Current saved values */}
          {saved !== null && (
            <div style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--hair)',
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink-muted)',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                現在の DB 保存値 // saved config
              </div>
              <div className="meta-grid">
                <span className="k">解決方式</span>
                <span className="v mono" style={{ fontSize: 12 }}>{saved.tenant_resolution_mode}</span>
                {saved.tenant_org_slug !== '' && (
                  <>
                    <span className="k">組織スラッグ</span>
                    <span className="v mono" style={{ fontSize: 12 }}>{saved.tenant_org_slug}</span>
                  </>
                )}
                {saved.tenant_resolution_mode === 'subdomain' && saved.tenant_base_domain !== '' && (
                  <>
                    <span className="k">ベースドメイン</span>
                    <span className="v mono" style={{ fontSize: 12 }}>{saved.tenant_base_domain}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </FormPanel>
  );
}
