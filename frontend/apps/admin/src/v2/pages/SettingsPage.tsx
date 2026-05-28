/**
 * SettingsPage — v2 リデザイン実装 (#264)
 * 左 rail（概要 / モデル / ウィジェット / アカウント / システム / スーパー管理者）+ 右セクション切替
 * 概要セクション追加 (#296)
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Layout } from '../Layout';
import { getLlmSettings, testLlmConnection, updateLlmSettings } from '@nene-corpus/api-client/llm-settings';
import { getChatSettings, updateChatSettings } from '@nene-corpus/api-client/chat-settings';
import { getChatLimitsSettings, updateChatLimitsSettings, listSources, getAnalyticsSummary } from '@nene-corpus/api-client';
import {
  getNotificationSettings,
  updateNotificationSettings,
  sendTestMail,
} from '@nene-corpus/api-client/notifications';
import {
  getAppearanceSettings,
  updateAppearanceSettings,
} from '@nene-corpus/api-client/appearance';
import { changeAdminPassword, changeAdminEmail } from '@nene-corpus/api-client/account';
import type {
  LlmSettingsResponse,
  ChatSettingsResponse,
  ChatLimitsSettingsResponse,
  AppearanceSettingsResponse,
  ListSourcesResponse,
  WidgetLayout,
  WidgetTheme,
  WidgetPosition,
} from '@nene-corpus/api-client/types';
import type { NotificationSettings } from '@nene-corpus/api-client/notifications';
import type { AnalyticsSummaryResponse } from '@nene-corpus/api-client/analytics';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { adminApiBase } from '../../config';
import { buildEmbedSnippet } from '../../embedSnippet';
import { DEFAULT_WIDGET_LAYOUT } from '@nene-corpus/api-client/types';
import { TenantResolutionSection } from './superadmin/TenantResolutionSection';
import { OrganizationsSection } from './superadmin/OrganizationsSection';
import { useNavigate } from '../router';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Section =
  | 'overview'
  | 'llm'
  | 'embed-widget'
  | 'appearance'
  | 'embed-snippet'
  | 'password'
  | 'email'
  | 'chat-settings'
  | 'chat-limits'
  | 'notifications'
  | 'hosting'
  | 'tenant-resolution'
  | 'organizations';

interface SettingsPageProps {
  token?: string;
  onLogout?: () => void;
  role?: 'admin' | 'superadmin';
}

// ─────────────────────────────────────────────────────────────
// Rail Nav item
// ─────────────────────────────────────────────────────────────

interface RailItemProps {
  label: string;
  section: Section;
  active: Section;
  indicator?: 'dot' | 'check' | null;
  onSelect: (s: Section) => void;
}

function RailItem({ label, section, active, indicator, onSelect }: RailItemProps) {
  const isOn = active === section;
  return (
    <button
      type="button"
      className="set-rail-item"
      data-on={isOn ? '' : undefined}
      onClick={() => onSelect(section)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '7px 10px',
        borderRadius: 5,
        fontSize: 13,
        color: isOn ? 'var(--primary)' : 'var(--ink-soft)',
        background: isOn ? 'var(--primary-soft)' : 'none',
        fontWeight: isOn ? 600 : 400,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        margin: '1px 0',
        transition: 'background 120ms ease, color 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isOn) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-hover)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isOn) {
          (e.currentTarget as HTMLButtonElement).style.background = 'none';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-soft)';
        }
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      {indicator === 'dot' && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
      )}
      {indicator === 'check' && (
        <span style={{ color: 'var(--success-fg)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</span>
      )}
    </button>
  );
}

function RailSection({ label }: { label: string }) {
  return (
    <div style={{
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 10,
      fontWeight: 600,
      color: 'var(--ink-faint)',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      padding: '12px 10px 6px',
    }}>
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Form panel wrapper
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Field components
// ─────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  labelEn?: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
}

function Field({ label, labelEn, required, hint, children }: FieldProps) {
  return (
    <div className="field">
      <label className="field-label">
        {label}
        {labelEn && <span className="en">{labelEn}</span>}
        {required && (
          <span style={{ color: 'var(--danger)', fontSize: 11, fontWeight: 700 }}>*</span>
        )}
      </label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
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

// ─────────────────────────────────────────────────────────────
// Section: 概要（Overview）
// ─────────────────────────────────────────────────────────────

interface OverviewData {
  sources: ListSourcesResponse | null;
  llm: LlmSettingsResponse | null;
  analytics: AnalyticsSummaryResponse | null;
  notifications: NotificationSettings | null;
  appearance: AppearanceSettingsResponse | null;
  chatLimits: ChatLimitsSettingsResponse | null;
}

interface OverviewCardProps {
  title: string;
  titleEn: string;
  onClick: () => void;
  children: React.ReactNode;
}

function OverviewCard({ title, titleEn, onClick, children }: OverviewCardProps) {
  return (
    <button
      type="button"
      className="set-card"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        alignItems: 'flex-start',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 10,
        width: '100%',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-strong)' }}>{title}</span>
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 500,
          color: 'var(--ink-faint)',
          letterSpacing: '0.04em',
        }}>
          {titleEn}
        </span>
      </div>
      <div className="meta-grid" style={{ width: '100%' }}>
        {children}
      </div>
    </button>
  );
}

function OverviewSection({ token, onNavigate }: { token: string; onNavigate: (s: Section) => void }) {
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewData>({
    sources: null,
    llm: null,
    analytics: null,
    notifications: null,
    appearance: null,
    chatLimits: null,
  });

  useEffect(() => {
    let cancelled = false;

    void Promise.allSettled([
      listSources(token, adminApiBase, { limit: 200 }),
      getLlmSettings(token, adminApiBase),
      getAnalyticsSummary(token, adminApiBase),
      getNotificationSettings(token, adminApiBase),
      getAppearanceSettings(token, adminApiBase),
      getChatLimitsSettings(token, adminApiBase),
    ]).then(([sourcesRes, llmRes, analyticsRes, notifRes, appearanceRes, limitsRes]) => {
      if (cancelled) return;
      setData({
        sources: sourcesRes.status === 'fulfilled' ? sourcesRes.value : null,
        llm: llmRes.status === 'fulfilled' ? llmRes.value : null,
        analytics: analyticsRes.status === 'fulfilled' ? analyticsRes.value : null,
        notifications: notifRes.status === 'fulfilled' ? notifRes.value : null,
        appearance: appearanceRes.status === 'fulfilled' ? appearanceRes.value : null,
        chatLimits: limitsRes.status === 'fulfilled' ? limitsRes.value : null,
      });
    });

    return () => { cancelled = true; };
  }, [token]);

  const dash = '—';

  // Corpus stats
  const sourceCount = data.sources !== null ? String(data.sources.total) : dash;
  const chunkTotal = data.sources !== null
    ? String(data.sources.sources.reduce((sum, s) => sum + s.chunk_count, 0))
    : dash;
  const processingCount = data.sources !== null
    ? String(data.sources.sources.filter((s) => s.status === 'processing').length)
    : dash;

  // LLM stats
  const llmConfigured = data.llm?.configured ?? null;
  const llmProvider = 'Anthropic';
  const llmModel = data.llm?.model ?? dash;

  // Chat stats
  const todaySessions = data.analytics !== null ? String(data.analytics.sessions.today) : dash;
  const tokenInputUsed = data.analytics !== null ? data.analytics.tokens.input_total : null;
  const tokenOutputUsed = data.analytics !== null ? data.analytics.tokens.output_total : null;
  const dailyInputBudget = data.chatLimits?.daily_tokens_global ?? null;

  function formatTokenCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }

  const tokenUsageDisplay = tokenInputUsed !== null && tokenOutputUsed !== null
    ? formatTokenCount(tokenInputUsed + tokenOutputUsed)
    : dash;
  const tokenBudgetDisplay = dailyInputBudget !== null && dailyInputBudget > 0
    ? ` / ${formatTokenCount(dailyInputBudget)}`
    : '';

  // Notification stats
  const smtpConfigured = data.notifications?.smtp_configured ?? null;
  const dailyReportOn = data.notifications?.daily_report_enabled ?? null;

  // Appearance stats
  const themeColor = data.appearance?.theme.color_primary ?? null;
  const heroImageSet = data.appearance?.hero.image_url !== null && data.appearance?.hero.image_url !== undefined;

  return (
    <div>
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
          概要
          <span style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--ink-faint)',
            letterSpacing: '0.04em',
          }}>
            // overview
          </span>
        </h3>
        <div style={{
          fontSize: 13,
          color: 'var(--ink-muted)',
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid var(--hair)',
        }}>
          システム全体の状態を確認します。各カードをクリックすると設定に移動します。
        </div>

        <div className="settings-grid">
          {/* 1. コーパス */}
          <OverviewCard
            title="コーパス"
            titleEn="// corpus"
            onClick={() => navigate('/sources')}
          >
            <span className="k">sources</span>
            <span className="v mono" style={{ fontSize: 12 }}>{sourceCount}</span>
            <span className="k">chunks</span>
            <span className="v mono" style={{ fontSize: 12 }}>{chunkTotal}</span>
            <span className="k">processing</span>
            <span className="v mono" style={{ fontSize: 12 }}>{processingCount}</span>
          </OverviewCard>

          {/* 2. LLM */}
          <OverviewCard
            title="LLM"
            titleEn="// llm"
            onClick={() => onNavigate('llm')}
          >
            <span className="k">status</span>
            <span className="v" style={{ fontSize: 12 }}>
              {llmConfigured === null
                ? dash
                : llmConfigured
                  ? <span style={{ color: 'var(--success-fg)', fontWeight: 700 }}>✓ 設定済み</span>
                  : <span style={{ color: 'var(--danger)', fontWeight: 700 }}>● 未設定</span>
              }
            </span>
            <span className="k">provider</span>
            <span className="v mono" style={{ fontSize: 12 }}>{data.llm !== null ? llmProvider : dash}</span>
            <span className="k">model</span>
            <span className="v mono" style={{ fontSize: 12 }}>{llmModel}</span>
          </OverviewCard>

          {/* 3. チャット */}
          <OverviewCard
            title="チャット"
            titleEn="// chat"
            onClick={() => navigate('/conversations')}
          >
            <span className="k">today sessions</span>
            <span className="v mono" style={{ fontSize: 12 }}>{todaySessions}</span>
            <span className="k">tokens (total)</span>
            <span className="v mono" style={{ fontSize: 12 }}>
              {tokenUsageDisplay}{tokenBudgetDisplay !== '' && <span style={{ color: 'var(--ink-faint)' }}>{tokenBudgetDisplay}</span>}
            </span>
          </OverviewCard>

          {/* 4. 通知 */}
          <OverviewCard
            title="通知"
            titleEn="// notifications"
            onClick={() => onNavigate('notifications')}
          >
            <span className="k">SMTP</span>
            <span className="v" style={{ fontSize: 12 }}>
              {smtpConfigured === null
                ? dash
                : smtpConfigured
                  ? <span style={{ color: 'var(--success-fg)', fontWeight: 700 }}>✓ 設定済み</span>
                  : <span style={{ color: 'var(--ink-muted)' }}>未設定</span>
              }
            </span>
            <span className="k">daily report</span>
            <span className="v" style={{ fontSize: 12 }}>
              {dailyReportOn === null
                ? dash
                : dailyReportOn
                  ? <span style={{ color: 'var(--success-fg)', fontWeight: 700 }}>on</span>
                  : <span style={{ color: 'var(--ink-muted)' }}>off</span>
              }
            </span>
          </OverviewCard>

          {/* 5. 外観 */}
          <OverviewCard
            title="外観"
            titleEn="// appearance"
            onClick={() => onNavigate('appearance')}
          >
            <span className="k">theme color</span>
            <span className="v" style={{ fontSize: 12 }}>
              {themeColor !== null
                ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: themeColor,
                      border: '1px solid var(--hair-strong)',
                      flexShrink: 0,
                    }} />
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>{themeColor}</span>
                  </span>
                )
                : dash
              }
            </span>
            <span className="k">hero image</span>
            <span className="v" style={{ fontSize: 12 }}>
              {data.appearance === null
                ? dash
                : heroImageSet
                  ? <span style={{ color: 'var(--success-fg)', fontWeight: 700 }}>✓ セット済み</span>
                  : <span style={{ color: 'var(--ink-muted)' }}>未設定</span>
              }
            </span>
          </OverviewCard>

          {/* 6. ホスティング */}
          <OverviewCard
            title="ホスティング"
            titleEn="// hosting"
            onClick={() => onNavigate('hosting')}
          >
            <span className="k">version</span>
            <span className="v mono" style={{ fontSize: 12 }}>NeNe Corpus v0.4.x</span>
            <span className="k">storage</span>
            <span className="v mono" style={{ fontSize: 12 }}>
              {dash} <span style={{ color: 'var(--ink-faint)' }}>used</span>
            </span>
            <span className="k">chunks</span>
            <span className="v mono" style={{ fontSize: 12 }}>
              {chunkTotal !== dash ? chunkTotal : dash}
            </span>
          </OverviewCard>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: LLM 設定
// ─────────────────────────────────────────────────────────────

function LlmSection({ token }: { token: string }) {
  const t = useMsg();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [settings, setSettings] = useState<LlmSettingsResponse | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [model, setModel] = useState('claude-sonnet-4-5');
  const [maxTokens, setMaxTokens] = useState('1024');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getLlmSettings(token, adminApiBase)
      .then((loaded) => {
        if (!cancelled) {
          setSettings(loaded);
          setModel(loaded.model);
          setMaxTokens(String(loaded.max_tokens));
          setIsLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.llm.loadFailed));
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [token, t]);

  function buildTestPayload() {
    const payload: { api_key?: string; model: string } = { model: model.trim() };
    const trimmedKey = apiKeyDraft.trim();
    if (trimmedKey !== '') payload.api_key = trimmedKey;
    return payload;
  }

  function buildSavePayload() {
    const payload: { model: string; max_tokens: number; api_key?: string } = {
      model: model.trim(),
      max_tokens: Number.parseInt(maxTokens, 10),
    };
    const trimmedKey = apiKeyDraft.trim();
    if (trimmedKey !== '') payload.api_key = trimmedKey;
    return payload;
  }

  async function handleTest(): Promise<void> {
    setIsTesting(true);
    setError(null);
    setTestMsg(null);
    try {
      await testLlmConnection(token, buildTestPayload(), adminApiBase);
      setTestMsg(t(Msg.admin.llm.testSuccess));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.llm.testFailed));
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    setTestMsg(null);
    try {
      const saved = await updateLlmSettings(token, buildSavePayload(), adminApiBase);
      setSettings(saved);
      setModel(saved.model);
      setMaxTokens(String(saved.max_tokens));
      setApiKeyDraft('');
      setSuccess(t(Msg.admin.llm.saveSuccess));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.llm.saveFailed));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormPanel title="LLM 設定" titleEn="// llm config" lead="エンドユーザの質問に回答するモデルを選択し、API キーを設定します。">
      {isLoading ? (
        <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{t(Msg.common.loading)}</p>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="プロバイダー" labelEn="provider">
              <select className="field-select" defaultValue="Anthropic">
                <option>Anthropic</option>
                <option>OpenAI (互換)</option>
              </select>
            </Field>
            <Field label="モデル" labelEn="model">
              <input
                className="field-input"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="claude-sonnet-4-5"
              />
            </Field>
          </div>

          <Field
            label="API キー"
            labelEn="api key"
            required
            hint={
              <>
                <a href="https://console.anthropic.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  console.anthropic.com
                </a>
                {' '}で取得した API キーを入力してください。キーはサーバ上で暗号化されて保存されます。
                {settings?.api_key_masked && (
                  <span style={{ marginLeft: 8, color: 'var(--ink-muted)' }}>
                    現在: <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{settings.api_key_masked}</span>
                  </span>
                )}
              </>
            }
          >
            <input
              className="field-input"
              type="password"
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
              placeholder={t(Msg.admin.llm.apiKeyPlaceholder)}
              autoComplete="off"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Field label="最大トークン" labelEn="max tokens">
              <input
                className="field-input"
                type="number"
                min={1}
                max={8192}
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
              />
            </Field>
            <Field label="temperature">
              <input
                className="field-input"
                type="number"
                defaultValue="0.3"
                step={0.1}
                min={0}
                max={1}
                disabled
                title="将来のバージョンで設定可能になります"
              />
            </Field>
            <Field label="タイムアウト" labelEn="timeout (s)">
              <input
                className="field-input"
                type="number"
                defaultValue="30"
                disabled
                title="将来のバージョンで設定可能になります"
              />
            </Field>
          </div>

          {error !== null && <StatusMsg type="error" text={error} />}
          {success !== null && <StatusMsg type="success" text={success} />}
          {testMsg !== null && <StatusMsg type="success" text={testMsg} />}

          <FormActions>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={isTesting}
              onClick={() => void handleTest()}
            >
              {isTesting ? t(Msg.admin.llm.testing) : '接続テスト'}
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? t(Msg.admin.llm.saving) : t(Msg.admin.llm.save)}
            </button>
          </FormActions>
        </form>
      )}
    </FormPanel>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: 埋め込みウィジェット（スニペット）
// ─────────────────────────────────────────────────────────────

function EmbedWidgetSection() {
  const t = useMsg();
  const snippet = useMemo(() => buildEmbedSnippet(adminApiBase), []);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  async function handleCopy(): Promise<void> {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError('クリップボードへのコピーに失敗しました');
    }
  }

  return (
    <FormPanel
      title="サイトに埋め込む"
      titleEn="// embed snippet"
      lead={
        <>
          下記のスニペットをサイトの{' '}
          <code style={{ background: 'var(--bg-soft)', padding: '1px 5px', borderRadius: 3, color: 'var(--ink-soft)' }}>
            {'</body>'}
          </code>
          {' '}直前に貼り付けてください。
        </>
      }
    >
      <pre className="codeblock" style={{ position: 'relative', margin: '0 0 8px' }}>
        {snippet}
      </pre>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={() => void handleCopy()}
        >
          {copied ? 'コピーしました' : 'コピー'}
        </button>
        {copyError !== null && <span style={{ fontSize: 12, color: 'var(--danger-text)' }}>{copyError}</span>}
      </div>
      <div className="field-hint" style={{ marginTop: 14 }}>
        ウィジェットの色や位置を変更するには{' '}
        <strong style={{ color: 'var(--ink)' }}>外観</strong>
        {' '}設定をご利用ください。
      </div>
    </FormPanel>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: ホスティング情報
// ─────────────────────────────────────────────────────────────

function HostingSection() {
  return (
    <FormPanel title="ホスティング" titleEn="// hosting" lead="現在の稼働環境と利用状況。">
      <div className="meta-grid">
        <span className="k">version</span>
        <span className="v mono" style={{ fontSize: 12 }}>NeNe Corpus v0.4.x</span>
        <span className="k">hosting</span>
        <span className="v">Tier A · 共有ホスティング (PHP)</span>
        <span className="k">storage</span>
        <span className="v mono" style={{ fontSize: 12 }}>
          — <span style={{ color: 'var(--ink-faint)' }}>used</span>
        </span>
        <span className="k">chunks</span>
        <span className="v mono" style={{ fontSize: 12 }}>
          — <span style={{ color: 'var(--ink-faint)' }}>used</span>
        </span>
        <span className="k">backup</span>
        <span className="v">
          <span
            className="pill pill-ready"
            style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: 600 }}
          >
            毎日自動
          </span>
        </span>
      </div>
      <div style={{
        display: 'flex',
        gap: 8,
        paddingTop: 18,
        marginTop: 18,
        borderTop: '1px solid var(--hair)',
        justifyContent: 'flex-start',
      }}>
        <button className="btn btn-ghost" type="button">エクスポート (.zip)</button>
        <button className="btn btn-ghost" type="button">バックアップ履歴を見る</button>
      </div>
    </FormPanel>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: 外観
// ─────────────────────────────────────────────────────────────

const DEFAULT_THEME: WidgetTheme = {
  color_primary: '#2563eb',
  color_surface: '#ffffff',
  color_text: '#1f2937',
  radius_panel: '0.5rem',
  radius_control: '0.5rem',
  max_width: '100%',
};

const WIDGET_POSITIONS: WidgetPosition[] = [
  'inline', 'bottom_right', 'bottom_left', 'top_right', 'top_left',
];

const POSITION_LABELS: Record<WidgetPosition, string> = {
  inline: 'インライン',
  bottom_right: '右下',
  bottom_left: '左下',
  top_right: '右上',
  top_left: '左上',
};

function AppearanceSection({ token }: { token: string }) {
  const t = useMsg();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [theme, setTheme] = useState<WidgetTheme>(DEFAULT_THEME);
  const [layoutForm, setLayoutForm] = useState<WidgetLayout>(DEFAULT_WIDGET_LAYOUT);
  const [widgetLocale, setWidgetLocale] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getAppearanceSettings(token, adminApiBase)
      .then((s: AppearanceSettingsResponse) => {
        if (!cancelled) {
          setTheme(s.theme);
          setLayoutForm(s.layout);
          setWidgetLocale(s.widget_locale ?? '');
          setIsLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.appearance.loadFailed));
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [token, t]);

  function updateThemeField(field: keyof WidgetTheme, value: string): void {
    setTheme((prev) => ({ ...prev, [field]: value }));
  }

  function updateLayoutField<K extends keyof WidgetLayout>(field: K, value: WidgetLayout[K]): void {
    setLayoutForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'position' && value === 'inline') next.floating_launcher = false;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const appSettings = await getAppearanceSettings(token, adminApiBase);
      await updateAppearanceSettings(token, {
        widget_locale: widgetLocale === '' ? null : (widgetLocale as AppearanceSettingsResponse['widget_locale']),
        theme,
        hero: appSettings.hero,
        chat: appSettings.chat,
        layout: layoutForm,
        custom_css: appSettings.custom_css ?? null,
      }, adminApiBase);
      setSuccess(t(Msg.admin.appearance.saveSuccess));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.appearance.saveFailed));
    } finally {
      setIsSaving(false);
    }
  }

  const layoutFixed = layoutForm.position !== 'inline';

  return (
    <FormPanel title="外観" titleEn="// appearance" lead="埋め込みウィジェットのテーマ・レイアウトを設定します。">
      {isLoading ? (
        <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{t(Msg.common.loading)}</p>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          {/* ロケール */}
          <Field label="言語" labelEn="locale">
            <select
              className="field-select"
              value={widgetLocale}
              onChange={(e) => setWidgetLocale(e.target.value)}
            >
              <option value="">ブラウザ設定に合わせる</option>
              <option value="ja">日本語</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="zh-Hans">简体中文</option>
              <option value="pt-BR">Português (BR)</option>
              <option value="de">Deutsch</option>
            </select>
          </Field>

          {/* テーマカラー */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"JetBrains Mono", monospace' }}>
              テーマカラー
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {([
                ['アクセントカラー', 'color_primary'],
                ['背景色', 'color_surface'],
                ['テキスト色', 'color_text'],
              ] as [string, keyof WidgetTheme][]).map(([label, field]) => (
                <div key={field} className="field">
                  <label className="field-label">{label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="color"
                      value={theme[field] as string}
                      onChange={(e) => updateThemeField(field, e.target.value)}
                      style={{ width: 32, height: 32, borderRadius: 5, border: '1px solid var(--hair-strong)', cursor: 'pointer', background: 'none', padding: 2 }}
                    />
                    <input
                      className="field-input"
                      type="text"
                      value={theme[field] as string}
                      onChange={(e) => updateThemeField(field, e.target.value)}
                      style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 配置 */}
          <Field label="配置" labelEn="position">
            <select
              className="field-select"
              value={layoutForm.position}
              onChange={(e) => updateLayoutField('position', e.target.value as WidgetPosition)}
            >
              {WIDGET_POSITIONS.map((v) => (
                <option key={v} value={v}>{POSITION_LABELS[v]}</option>
              ))}
            </select>
          </Field>

          {layoutFixed && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="X オフセット" labelEn="offset x">
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  max={256}
                  value={layoutForm.offset_x}
                  onChange={(e) => updateLayoutField('offset_x', Number(e.target.value))}
                />
              </Field>
              <Field label="Y オフセット" labelEn="offset y">
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  max={256}
                  value={layoutForm.offset_y}
                  onChange={(e) => updateLayoutField('offset_y', Number(e.target.value))}
                />
              </Field>
            </div>
          )}

          {error !== null && <StatusMsg type="error" text={error} />}
          {success !== null && <StatusMsg type="success" text={success} />}

          <FormActions>
            <button className="btn btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? t(Msg.admin.appearance.saving) : t(Msg.admin.appearance.save)}
            </button>
          </FormActions>
        </form>
      )}
    </FormPanel>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: チャット制限
// ─────────────────────────────────────────────────────────────

type DraftLimits = {
  [K in keyof ChatLimitsSettingsResponse]: string;
};

function toDraft(v: ChatLimitsSettingsResponse): DraftLimits {
  return {
    max_message_chars: String(v.max_message_chars),
    message_interval_seconds: String(v.message_interval_seconds),
    session_requests_per_hour: String(v.session_requests_per_hour),
    ip_requests_per_hour: String(v.ip_requests_per_hour),
    daily_requests_per_ip: String(v.daily_requests_per_ip),
    daily_requests_global: String(v.daily_requests_global),
    daily_tokens_per_ip: String(v.daily_tokens_per_ip),
    daily_tokens_global: String(v.daily_tokens_global),
  };
}

const LIMITS_FIELDS: Array<{ key: keyof ChatLimitsSettingsResponse; labelKey: keyof typeof Msg.admin.chatLimits }> = [
  { key: 'max_message_chars', labelKey: 'maxMessageChars' },
  { key: 'message_interval_seconds', labelKey: 'messageIntervalSeconds' },
  { key: 'session_requests_per_hour', labelKey: 'sessionRequestsPerHour' },
  { key: 'ip_requests_per_hour', labelKey: 'ipRequestsPerHour' },
  { key: 'daily_requests_per_ip', labelKey: 'dailyRequestsPerIp' },
  { key: 'daily_requests_global', labelKey: 'dailyRequestsGlobal' },
  { key: 'daily_tokens_per_ip', labelKey: 'dailyTokensPerIp' },
  { key: 'daily_tokens_global', labelKey: 'dailyTokensGlobal' },
];

function ChatLimitsSection({ token }: { token: string }) {
  const t = useMsg();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftLimits>({
    max_message_chars: '800',
    message_interval_seconds: '10',
    session_requests_per_hour: '20',
    ip_requests_per_hour: '60',
    daily_requests_per_ip: '200',
    daily_requests_global: '2000',
    daily_tokens_per_ip: '100000',
    daily_tokens_global: '1000000',
  });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getChatLimitsSettings(token, adminApiBase)
      .then((data) => {
        if (!cancelled) {
          setDraft(toDraft(data));
          setIsLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.chatLimits.loadFailed));
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [token, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const body = {
        max_message_chars: Number.parseInt(draft.max_message_chars, 10) || 0,
        message_interval_seconds: Number.parseInt(draft.message_interval_seconds, 10) || 0,
        session_requests_per_hour: Number.parseInt(draft.session_requests_per_hour, 10) || 0,
        ip_requests_per_hour: Number.parseInt(draft.ip_requests_per_hour, 10) || 0,
        daily_requests_per_ip: Number.parseInt(draft.daily_requests_per_ip, 10) || 0,
        daily_requests_global: Number.parseInt(draft.daily_requests_global, 10) || 0,
        daily_tokens_per_ip: Number.parseInt(draft.daily_tokens_per_ip, 10) || 0,
        daily_tokens_global: Number.parseInt(draft.daily_tokens_global, 10) || 0,
      };
      const saved = await updateChatLimitsSettings(token, body, adminApiBase);
      setDraft(toDraft(saved));
      setSuccess(t(Msg.admin.chatLimits.saveSuccess));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.chatLimits.saveFailed));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormPanel
      title="チャット制限"
      titleEn="// chat limits"
      lead="メッセージ文字数・リクエスト数・トークン数の上限を設定します。0 は無制限。"
    >
      {isLoading ? (
        <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{t(Msg.common.loading)}</p>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {LIMITS_FIELDS.map(({ key, labelKey }) => (
              <Field
                key={key}
                label={t(Msg.admin.chatLimits[labelKey])}
                hint={t(Msg.admin.chatLimits.zeroMeansUnlimited)}
              >
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  value={draft[key]}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </Field>
            ))}
          </div>

          {error !== null && <StatusMsg type="error" text={error} />}
          {success !== null && <StatusMsg type="success" text={success} />}

          <FormActions>
            <button className="btn btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? t(Msg.admin.chatLimits.saving) : t(Msg.admin.chatLimits.save)}
            </button>
          </FormActions>
        </form>
      )}
    </FormPanel>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: 通知設定
// ─────────────────────────────────────────────────────────────

function NotificationsSection({ token }: { token: string }) {
  const t = useMsg();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await updateNotificationSettings(token, {
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
        regenerate_daily_report_token: false,
      }, adminApiBase);
      setSettings(updated);
      setSmtpPassword('');
      setSaveMsg({ ok: true, text: t(Msg.admin.notifications.saveSuccess) });
    } catch {
      setSaveMsg({ ok: false, text: t(Msg.admin.notifications.saveFailed) });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestMail(): Promise<void> {
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

  if (loadError) {
    return (
      <FormPanel title="通知設定" titleEn="// notifications" lead="">
        <p style={{ color: 'var(--danger-text)', fontSize: 13 }}>{loadError}</p>
      </FormPanel>
    );
  }

  if (!settings) {
    return (
      <FormPanel title="通知設定" titleEn="// notifications" lead="">
        <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>{t(Msg.common.loading)}</p>
      </FormPanel>
    );
  }

  return (
    <FormPanel title="通知設定" titleEn="// notifications" lead="メール通知・日次レポートの設定を行います。">
      <form onSubmit={(e) => void handleSave(e)}>
        {/* SMTP */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"JetBrains Mono", monospace' }}>
            {t(Msg.admin.notifications.smtpSection)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t(Msg.admin.notifications.smtpHost)}>
              <input className="field-input" type="text" placeholder="smtp.example.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
            </Field>
            <Field label={t(Msg.admin.notifications.smtpPort)}>
              <input className="field-input" type="number" min={1} max={65535} value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} />
            </Field>
            <Field label={t(Msg.admin.notifications.smtpUsername)}>
              <input className="field-input" type="text" autoComplete="username" value={smtpUsername} onChange={(e) => setSmtpUsername(e.target.value)} />
            </Field>
            <Field label={t(Msg.admin.notifications.smtpPassword)}>
              <input
                className="field-input"
                type="password"
                autoComplete="new-password"
                placeholder={settings.smtp_password_set ? t(Msg.admin.notifications.smtpPasswordPlaceholder) : ''}
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
              />
            </Field>
            <Field label={t(Msg.admin.notifications.smtpEncryption)}>
              <select className="field-select" value={smtpEncryption} onChange={(e) => setSmtpEncryption(e.target.value as 'tls' | 'ssl' | 'none')}>
                <option value="tls">TLS (STARTTLS)</option>
                <option value="ssl">SSL/TLS</option>
                <option value="none">None</option>
              </select>
            </Field>
            <Field label={t(Msg.admin.notifications.smtpFromAddress)}>
              <input className="field-input" type="email" value={smtpFromAddress} onChange={(e) => setSmtpFromAddress(e.target.value)} />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label={t(Msg.admin.notifications.smtpFromName)}>
                <input className="field-input" type="text" value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} />
              </Field>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label={t(Msg.admin.notifications.notifyEmail)} hint={t(Msg.admin.notifications.notifyEmailHelp)}>
                <input className="field-input" type="email" placeholder="operator@example.com" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        {/* レートリミットアラート */}
        <div style={{ borderTop: '1px solid var(--hair)', paddingTop: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"JetBrains Mono", monospace' }}>
            {t(Msg.admin.notifications.rateLimitSection)}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={rateLimitEnabled} onChange={(e) => setRateLimitEnabled(e.target.checked)} />
            {t(Msg.admin.notifications.rateLimitEnabled)}
          </label>
          {rateLimitEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)', flexShrink: 0 }}>{t(Msg.admin.notifications.rateLimitCooldown)}</span>
              <input className="field-input" type="number" min={1} value={rateLimitCooldown} onChange={(e) => setRateLimitCooldown(Number(e.target.value))} style={{ width: 80 }} />
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{t(Msg.admin.notifications.rateLimitCooldownUnit)}</span>
            </div>
          )}
        </div>

        {/* 日次レポート */}
        <div style={{ borderTop: '1px solid var(--hair)', paddingTop: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"JetBrains Mono", monospace' }}>
            {t(Msg.admin.notifications.dailyReportSection)}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={dailyReportEnabled} onChange={(e) => setDailyReportEnabled(e.target.checked)} />
            {t(Msg.admin.notifications.dailyReportEnabled)}
          </label>
        </div>

        {saveMsg !== null && <StatusMsg type={saveMsg.ok ? 'success' : 'error'} text={saveMsg.text} />}

        <FormActions>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? t(Msg.admin.notifications.saving) : t(Msg.admin.notifications.save)}
          </button>
        </FormActions>
      </form>

      {/* テスト送信（フォームの外） */}
      <div style={{ borderTop: '1px solid var(--hair)', paddingTop: 18, marginTop: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"JetBrains Mono", monospace' }}>
          {t(Msg.admin.notifications.testMailSection)}
        </div>
        {!settings.smtp_configured && (
          <p style={{ fontSize: 12, color: 'var(--warning-text)', background: 'var(--warning-soft)', border: '1px solid var(--warning-border)', borderRadius: 5, padding: '6px 10px', marginBottom: 10 }}>
            {t(Msg.admin.notifications.smtpNotConfiguredWarning)}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            className="field-input"
            type="email"
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-ghost"
            type="button"
            disabled={testSending || !settings.smtp_configured || !testEmail}
            onClick={() => void handleTestMail()}
          >
            {testSending ? t(Msg.admin.notifications.testMailSending) : t(Msg.admin.notifications.testMailButton)}
          </button>
        </div>
        {testMsg !== null && <StatusMsg type={testMsg.ok ? 'success' : 'error'} text={testMsg.text} />}
      </div>
    </FormPanel>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: パスワード変更
// ─────────────────────────────────────────────────────────────

function PasswordSection({ token }: { token: string }) {
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
    if (current === '') { setError(t(Msg.admin.account.currentPasswordRequired)); return; }
    if (next.length < 8) { setError(t(Msg.admin.account.passwordTooShort)); return; }
    if (next !== confirm) { setError(t(Msg.admin.account.passwordMismatch)); return; }
    setSaving(true);
    try {
      await changeAdminPassword(token, { current_password: current, new_password: next }, adminApiBase);
      setSuccess(t(Msg.admin.account.passwordSaveSuccess));
      setCurrent(''); setNext(''); setConfirm('');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.common.genericError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormPanel title="パスワード変更" titleEn="// password" lead="現在のパスワードを確認してから新しいパスワードを設定します。">
      <form onSubmit={(e) => void handleSubmit(e)}>
        <Field label={t(Msg.admin.account.currentPassword)}>
          <input className="field-input" type="password" autoComplete="current-password" value={current} onChange={(e) => { setCurrent(e.target.value); setError(null); }} />
        </Field>
        <Field label={t(Msg.admin.account.newPassword)}>
          <input className="field-input" type="password" autoComplete="new-password" value={next} onChange={(e) => { setNext(e.target.value); setError(null); }} />
        </Field>
        <Field label={t(Msg.admin.account.confirmPassword)}>
          <input className="field-input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(null); }} />
        </Field>
        {error !== null && <StatusMsg type="error" text={error} />}
        {success !== null && <StatusMsg type="success" text={success} />}
        <FormActions>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? t(Msg.admin.account.saving) : t(Msg.admin.account.savePassword)}
          </button>
        </FormActions>
      </form>
    </FormPanel>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: メール変更
// ─────────────────────────────────────────────────────────────

function EmailSection({ token }: { token: string }) {
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
    if (current === '') { setError(t(Msg.admin.account.currentPasswordRequired)); return; }
    setSaving(true);
    try {
      await changeAdminEmail(token, { current_password: current, new_email: newEmail }, adminApiBase);
      setSuccess(t(Msg.admin.account.emailSaveSuccess));
      setCurrent(''); setNewEmail('');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.common.genericError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormPanel title="メールアドレス変更" titleEn="// email" lead="現在のパスワードを確認してから新しいメールアドレスを設定します。">
      <form onSubmit={(e) => void handleSubmit(e)}>
        <Field label={t(Msg.admin.account.currentPassword)}>
          <input className="field-input" type="password" autoComplete="current-password" value={current} onChange={(e) => { setCurrent(e.target.value); setError(null); }} />
        </Field>
        <Field label={t(Msg.admin.account.newEmail)}>
          <input className="field-input" type="email" autoComplete="email" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setError(null); }} />
        </Field>
        {error !== null && <StatusMsg type="error" text={error} />}
        {success !== null && <StatusMsg type="success" text={success} />}
        <FormActions>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? t(Msg.admin.account.saving) : t(Msg.admin.account.saveEmail)}
          </button>
        </FormActions>
      </form>
    </FormPanel>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: チャット設定（system prompt / fallback message）
// ─────────────────────────────────────────────────────────────

function ChatSettingsSection({ token }: { token: string }) {
  const t = useMsg();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<{ systemPrompt: string; fallbackMessage: string } | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getChatSettings(token, adminApiBase)
      .then((loaded: ChatSettingsResponse) => {
        if (!cancelled) {
          setDefaults({ systemPrompt: loaded.default_system_prompt, fallbackMessage: loaded.default_fallback_message });
          setSystemPrompt(loaded.system_prompt ?? '');
          setFallbackMessage(loaded.fallback_message ?? '');
          setIsLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.chatSettings.loadFailed));
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [token, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateChatSettings(token, {
        system_prompt: systemPrompt.trim() !== '' ? systemPrompt.trim() : null,
        fallback_message: fallbackMessage.trim() !== '' ? fallbackMessage.trim() : null,
      }, adminApiBase);
      setDefaults({ systemPrompt: updated.default_system_prompt, fallbackMessage: updated.default_fallback_message });
      setSystemPrompt(updated.system_prompt ?? '');
      setFallbackMessage(updated.fallback_message ?? '');
      setSuccess(t(Msg.admin.chatSettings.saveSuccess));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.chatSettings.saveFailed));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormPanel
      title="チャット設定"
      titleEn="// chat settings"
      lead="システムプロンプトとフォールバックメッセージを設定します。"
    >
      {isLoading ? (
        <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{t(Msg.common.loading)}</p>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          <Field
            label={t(Msg.admin.chatSettings.systemPrompt)}
            hint={t(Msg.admin.chatSettings.systemPromptHelp)}
          >
            <textarea
              className="field-textarea"
              value={systemPrompt}
              placeholder={defaults?.systemPrompt ?? ''}
              onChange={(e) => setSystemPrompt(e.target.value)}
              style={{ minHeight: 120 }}
            />
            {systemPrompt.trim() !== '' && (
              <button
                type="button"
                style={{ fontSize: 11.5, color: 'var(--ink-muted)', textDecoration: 'underline', marginTop: 4 }}
                onClick={() => setSystemPrompt('')}
              >
                {t(Msg.admin.chatSettings.resetToDefault)}
              </button>
            )}
          </Field>
          <Field
            label={t(Msg.admin.chatSettings.fallbackMessage)}
            hint={t(Msg.admin.chatSettings.fallbackMessageHelp)}
          >
            <textarea
              className="field-textarea"
              value={fallbackMessage}
              placeholder={defaults?.fallbackMessage ?? ''}
              onChange={(e) => setFallbackMessage(e.target.value)}
              style={{ minHeight: 80 }}
            />
            {fallbackMessage.trim() !== '' && (
              <button
                type="button"
                style={{ fontSize: 11.5, color: 'var(--ink-muted)', textDecoration: 'underline', marginTop: 4 }}
                onClick={() => setFallbackMessage('')}
              >
                {t(Msg.admin.chatSettings.resetToDefault)}
              </button>
            )}
          </Field>
          {error !== null && <StatusMsg type="error" text={error} />}
          {success !== null && <StatusMsg type="success" text={success} />}
          <FormActions>
            <button className="btn btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? t(Msg.admin.chatSettings.saving) : t(Msg.admin.chatSettings.save)}
            </button>
          </FormActions>
        </form>
      )}
    </FormPanel>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export function SettingsPage({ token, onLogout: _onLogout, role }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [llmConfigured, setLlmConfigured] = useState<boolean | null>(null);
  const isSuperadmin = role === 'superadmin';

  // LLM 設定状態を一度だけフェッチして rail の indicator を更新
  useEffect(() => {
    if (!token) return;
    getLlmSettings(token, adminApiBase)
      .then((s) => setLlmConfigured(s.configured))
      .catch(() => setLlmConfigured(false));
  }, [token]);

  if (!token) {
    return (
      <Layout active="settings" crumb="設定" corpusStatus="—" modelStatus="bad" stats="—">
        <div style={{ padding: '24px', color: 'var(--ink-muted)', fontSize: 13 }}>
          認証が必要です。
        </div>
      </Layout>
    );
  }

  function renderSection(): React.ReactNode {
    switch (activeSection) {
      case 'overview':             return <OverviewSection token={token!} onNavigate={setActiveSection} />;
      case 'llm':                  return <LlmSection token={token!} />;
      case 'embed-widget':         return <EmbedWidgetSection />;
      case 'appearance':           return <AppearanceSection token={token!} />;
      case 'embed-snippet':        return <EmbedWidgetSection />;
      case 'password':             return <PasswordSection token={token!} />;
      case 'email':                return <EmailSection token={token!} />;
      case 'chat-settings':        return <ChatSettingsSection token={token!} />;
      case 'chat-limits':          return <ChatLimitsSection token={token!} />;
      case 'notifications':        return <NotificationsSection token={token!} />;
      case 'hosting':              return <HostingSection />;
      case 'tenant-resolution':    return isSuperadmin ? <TenantResolutionSection token={token!} /> : null;
      case 'organizations':        return isSuperadmin ? <OrganizationsSection token={token!} /> : null;
      default:                     return null;
    }
  }

  const llmIndicator: 'dot' | 'check' | null =
    llmConfigured === null ? null : llmConfigured ? 'check' : 'dot';

  return (
    <Layout
      active="settings"
      crumb="設定"
      corpusStatus="3 / 4 取り込み済み"
      modelStatus={llmConfigured === true ? 'ok' : 'bad'}
      stats="86 セッション · 428 通"
    >
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <span>Settings</span>
            <span className="sep" />
            <span className="scope">システム設定</span>
          </div>
          <h1>設定</h1>
          <div className="desc">LLM、埋め込みウィジェット、アカウントなどを管理します。</div>
        </div>
      </div>

      {/* Settings layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        gap: 24,
        marginTop: 14,
        alignItems: 'start',
      }}>
        {/* Left rail */}
        <aside style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
          <RailItem label="概要 // overview" section="overview" active={activeSection} onSelect={setActiveSection} />

          <RailSection label="モデル" />
          <RailItem label="LLM" section="llm" active={activeSection} indicator={llmIndicator} onSelect={setActiveSection} />
          <RailItem label="埋め込みウィジェット" section="embed-widget" active={activeSection} indicator="check" onSelect={setActiveSection} />

          <RailSection label="ウィジェット" />
          <RailItem label="外観" section="appearance" active={activeSection} indicator="check" onSelect={setActiveSection} />
          <RailItem label="埋め込み方法" section="embed-snippet" active={activeSection} onSelect={setActiveSection} />

          <RailSection label="アカウント" />
          <RailItem label="パスワード" section="password" active={activeSection} onSelect={setActiveSection} />
          <RailItem label="メール変更" section="email" active={activeSection} onSelect={setActiveSection} />

          <RailSection label="システム" />
          <RailItem label="チャット設定" section="chat-settings" active={activeSection} onSelect={setActiveSection} />
          <RailItem label="チャット制限" section="chat-limits" active={activeSection} onSelect={setActiveSection} />
          <RailItem label="通知設定" section="notifications" active={activeSection} onSelect={setActiveSection} />
          <RailItem label="ホスティング" section="hosting" active={activeSection} onSelect={setActiveSection} />

          {isSuperadmin && (
            <>
              <RailSection label="スーパー管理者" />
              <RailItem label="テナント解決方式" section="tenant-resolution" active={activeSection} onSelect={setActiveSection} />
              <RailItem label="組織管理" section="organizations" active={activeSection} onSelect={setActiveSection} />
            </>
          )}
        </aside>

        {/* Main panel */}
        <div>
          {renderSection()}
        </div>
      </div>
    </Layout>
  );
}
