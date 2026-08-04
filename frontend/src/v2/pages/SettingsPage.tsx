/**
 * SettingsPage — v2 リデザイン実装 (#264)
 * 左 rail（モデル / ウィジェット / アカウント / システム / スーパー管理者）+ 右セクション切替
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Layout } from '../Layout';
import { useRoute, useNavigate } from '../router';
import { getLlmSettings, testLlmConnection, updateLlmSettings } from '@/shared/api/llm-settings';
import { getChatSettings, updateChatSettings } from '@/shared/api/chat-settings';
import { getChatLimitsSettings, updateChatLimitsSettings } from '@/shared/api';
import {
  getNotificationSettings,
  updateNotificationSettings,
  sendTestMail,
} from '@/shared/api/notifications';
import {
  getAppearanceSettings,
  updateAppearanceSettings,
  uploadHeroImage,
  uploadAvatarImage,
} from '@/shared/api/appearance';
import { changeAdminPassword, changeAdminEmail } from '@/shared/api/account';
import type {
  LlmSettingsResponse,
  ChatSettingsResponse,
  ChatLimitsSettingsResponse,
  AppearanceSettingsResponse,
  WidgetLayout,
  WidgetTheme,
  WidgetPosition,
  WidgetHero,
  WidgetChat,
} from '@/shared/api/types';
import type { NotificationSettings } from '@/shared/api/notifications';
import { Msg, useMsg } from '@/shared/i18n';
import { adminApiBase } from '../../config';
import { buildEmbedSnippet } from '../../embedSnippet';
import { readFileAsBase64 } from '../../fileBase64';
import { DEFAULT_WIDGET_LAYOUT, DEFAULT_WIDGET_HERO, DEFAULT_WIDGET_CHAT } from '@/shared/api/types';
import { TenantResolutionSection } from './superadmin/TenantResolutionSection';
import { OrganizationsSection } from './superadmin/OrganizationsSection';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SettingsPageProps {
  token?: string;
  onLogout?: () => void;
  role?: 'admin' | 'superadmin';
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
  const [hero, setHero] = useState<WidgetHero>(DEFAULT_WIDGET_HERO);
  const [chat, setChat] = useState<WidgetChat>(DEFAULT_WIDGET_CHAT);
  const [widgetLocale, setWidgetLocale] = useState('');
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getAppearanceSettings(token, adminApiBase)
      .then((s: AppearanceSettingsResponse) => {
        if (!cancelled) {
          setTheme(s.theme);
          setLayoutForm(s.layout);
          setHero(s.hero);
          setChat(s.chat);
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
        hero,
        chat,
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

  // Hero / アバター画像アップロード (#1)
  async function handleHeroUpload(file: File): Promise<void> {
    setUploadingHero(true);
    setError(null);
    try {
      const content = await readFileAsBase64(file);
      const res = await uploadHeroImage(token, { filename: file.name, content }, adminApiBase);
      setHero((prev) => ({ ...prev, image_url: res.image_url, show_image: true }));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Hero 画像のアップロードに失敗しました。');
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleAvatarUpload(file: File): Promise<void> {
    setUploadingAvatar(true);
    setError(null);
    try {
      const content = await readFileAsBase64(file);
      const res = await uploadAvatarImage(token, { filename: file.name, content }, adminApiBase);
      setChat((prev) => ({ ...prev, assistant_avatar_url: res.image_url, show_assistant_avatar: true }));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'アバター画像のアップロードに失敗しました。');
    } finally {
      setUploadingAvatar(false);
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

          {/* あいさつ文 — ライブプレビューに即時反映 (#2) */}
          <Field label="あいさつ文" labelEn="greeting">
            <input
              className="field-input"
              type="text"
              value={hero.title ?? ''}
              placeholder="例: ご質問はお気軽にどうぞ"
              onChange={(e) => setHero((prev) => ({ ...prev, title: e.target.value === '' ? null : e.target.value }))}
            />
          </Field>

          {/* Hero / アバター画像アップロード (#1) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Hero 画像" labelEn="hero image">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {hero.image_url !== null && hero.image_url !== '' && (
                  <img
                    src={hero.image_url}
                    alt=""
                    style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--hair-strong)' }}
                  />
                )}
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                  {uploadingHero ? 'アップロード中…' : '画像を選択'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploadingHero}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleHeroUpload(f); e.target.value = ''; }}
                  />
                </label>
                {hero.image_url !== null && hero.image_url !== '' && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHero((prev) => ({ ...prev, image_url: null }))}>
                    削除
                  </button>
                )}
              </div>
            </Field>
            <Field label="アバター画像" labelEn="avatar image">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {chat.assistant_avatar_url !== null && chat.assistant_avatar_url !== '' && (
                  <img
                    src={chat.assistant_avatar_url}
                    alt=""
                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--hair-strong)' }}
                  />
                )}
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                  {uploadingAvatar ? 'アップロード中…' : '画像を選択'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploadingAvatar}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleAvatarUpload(f); e.target.value = ''; }}
                  />
                </label>
                {chat.assistant_avatar_url !== null && chat.assistant_avatar_url !== '' && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setChat((prev) => ({ ...prev, assistant_avatar_url: null }))}>
                    削除
                  </button>
                )}
              </div>
            </Field>
          </div>

          {/* ライブプレビュー (#2) — accent / greeting / 画像を即時反映 */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, fontWeight: 600, color: 'var(--ink-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              ライブプレビュー // live preview
            </div>
            <div style={{ width: 280, border: '1px solid var(--hair)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-card)', background: 'var(--surface)' }}>
              <div style={{ height: 64, background: theme.color_primary, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', color: theme.color_primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', overflow: 'hidden', flexShrink: 0 }}>
                  {chat.assistant_avatar_url !== null && chat.assistant_avatar_url !== '' ? (
                    <img src={chat.assistant_avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : 'n'}
                </div>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>NeNe Corpus</span>
              </div>
              {hero.image_url !== null && hero.image_url !== '' && (
                <img src={hero.image_url} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ padding: '14px', fontSize: 13, color: 'var(--ink)', minHeight: 48, lineHeight: 1.5 }}>
                {hero.title ?? 'ご質問はお気軽にどうぞ'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderTop: '1px solid var(--hair)' }}>
                <div style={{ flex: 1, height: 30, borderRadius: 99, background: 'var(--bg-soft)', border: '1px solid var(--hair)' }} />
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: theme.color_primary, flexShrink: 0 }} />
              </div>
            </div>
          </div>

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

type SettingsTab = 'model' | 'widget' | 'account' | 'system';

// URL セグメント → タブ（サイドバーの semantic 名も解決）
const TAB_ALIASES: Record<string, SettingsTab> = {
  model: 'model', llm: 'model', embeddings: 'model',
  widget: 'widget', appearance: 'widget',
  account: 'account',
  system: 'system', superadmin: 'system',
};

export function SettingsPage({ token, onLogout, role }: SettingsPageProps) {
  const route = useRoute();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('model');
  const [llmConfigured, setLlmConfigured] = useState<boolean | null>(null);
  const isSuperadmin = role === 'superadmin';

  // URL → タブ同期（/settings/{tab}・/settings/llm 等の deep link）
  useEffect(() => {
    const seg = /^\/settings\/([a-z-]+)/.exec(route)?.[1];
    if (seg !== undefined && TAB_ALIASES[seg] !== undefined) {
      setActiveTab(TAB_ALIASES[seg]);
    }
  }, [route]);

  function selectTab(tab: SettingsTab): void {
    setActiveTab(tab);
    navigate(`/settings/${tab}`);
  }

  // LLM 設定状態を一度だけフェッチして rail の indicator を更新
  useEffect(() => {
    if (!token) return;
    getLlmSettings(token, adminApiBase)
      .then((s) => setLlmConfigured(s.configured))
      .catch(() => setLlmConfigured(false));
  }, [token]);

  if (!token) {
    return (
      <Layout active="settings" crumb="設定" corpusStatus="—" modelStatus="bad" stats="—" onLogout={onLogout}>
        <div style={{ padding: '24px', color: 'var(--ink-muted)', fontSize: 13 }}>
          認証が必要です。
        </div>
      </Layout>
    );
  }

  function renderTab(): React.ReactNode {
    switch (activeTab) {
      case 'model':
        return (
          <>
            <LlmSection token={token!} />
            <ChatSettingsSection token={token!} />
            <ChatLimitsSection token={token!} />
          </>
        );
      case 'widget':
        return (
          <>
            <AppearanceSection token={token!} />
            <EmbedWidgetSection />
          </>
        );
      case 'account':
        return (
          <>
            <PasswordSection token={token!} />
            <EmailSection token={token!} />
            <NotificationsSection token={token!} />
          </>
        );
      case 'system':
        return (
          <>
            <HostingSection />
            {isSuperadmin && <TenantResolutionSection token={token!} />}
            {isSuperadmin && <OrganizationsSection token={token!} />}
          </>
        );
      default:
        return null;
    }
  }

  return (
    <Layout
      active="settings"
      crumb="設定"
      corpusStatus="3 / 4 取り込み済み"
      modelStatus={llmConfigured === true ? 'ok' : 'bad'}
      stats="86 セッション · 428 通"
      onLogout={onLogout}
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

      {/* 上部 4 タブ */}
      <nav className="set-tabs">
        <button
          type="button"
          className={activeTab === 'model' ? 'on' : undefined}
          onClick={() => selectTab('model')}
        >
          モデル
          {llmConfigured === false && <span className="dot" aria-label="未設定" />}
          {llmConfigured === true && <span className="check" aria-hidden="true">✓</span>}
        </button>
        <button
          type="button"
          className={activeTab === 'widget' ? 'on' : undefined}
          onClick={() => selectTab('widget')}
        >
          ウィジェット
        </button>
        <button
          type="button"
          className={activeTab === 'account' ? 'on' : undefined}
          onClick={() => selectTab('account')}
        >
          アカウント
        </button>
        <button
          type="button"
          className={activeTab === 'system' ? 'on' : undefined}
          onClick={() => selectTab('system')}
        >
          システム
        </button>
      </nav>

      <div className="set-content">
        {renderTab()}
      </div>
    </Layout>
  );
}
