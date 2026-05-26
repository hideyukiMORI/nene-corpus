import { useEffect, useRef, useState } from 'react';
import { Msg, resolveMsgKey, applyLocaleFontFamily, toBcp47, useLocale, useMsg } from '@nene-corpus/i18n';
import { getLlmSettings } from '@nene-corpus/api-client/llm-settings';
import { LoginForm, SourcesPanel } from './SourcesPanel';
import { IngestionPanel } from './IngestionPanel';
import { ConversationLogsPanel, ConversationLogsSummary } from './ConversationLogsPanel';
import { AppearancePanel } from './AppearancePanel';
import { LlmSettingsPanel } from './LlmSettingsPanel';
import { LlmUnconfiguredBanner } from './LlmUnconfiguredBanner';
import { ChatSettingsPanel } from './ChatSettingsPanel';
import { ChatLimitsPanel } from './ChatLimitsPanel';
import { HelpPanel } from './HelpPanel';
import { LocaleSelector } from './LocaleSelector';
import { ThemeToggle } from './ThemeToggle';
import { scrollToHelp } from './scrollToHelp';
import { useAdminAuth } from './useAdminAuth';
import { adminApiBase } from './config';

export function App() {
  const t = useMsg();
  const { locale } = useLocale();
  const { token, profile, isReady, error, login, logout } = useAdminAuth();
  const [sourcesReloadKey, setSourcesReloadKey] = useState(0);
  const [logsOpen, setLogsOpen] = useState(false);

  // LLM 設定済みフラグ（null = ロード中 / 未チェック）
  const [isLlmConfigured, setIsLlmConfigured] = useState<boolean | null>(null);
  // LLM アコーディオン外部制御用
  const [llmPanelOpen, setLlmPanelOpen] = useState(false);
  const llmPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.documentElement.lang = toBcp47(locale);
    applyLocaleFontFamily(locale);
  }, [locale]);

  // ログイン直後に LLM 設定状態を取得してバナー表示を決定
  useEffect(() => {
    if (token === null) {
      setIsLlmConfigured(null);
      return;
    }

    let cancelled = false;
    getLlmSettings(token, adminApiBase)
      .then((s) => { if (!cancelled) setIsLlmConfigured(s.configured); })
      .catch(() => { /* 取得失敗時はバナーを出さない */ });

    return () => { cancelled = true; };
  }, [token]);

  function openLlmPanel(): void {
    setLlmPanelOpen(true);
    // DOM レンダリング後にスクロール
    requestAnimationFrame(() => {
      llmPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center nc-text-muted">
        {t(Msg.common.loading)}
      </div>
    );
  }

  return (
    <div className="min-h-screen text-fg">
      <header className="sticky top-0 z-40 border-b border-border bg-header/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-brand">{t(Msg.admin.app.title)}</h1>
            {profile && <p className="nc-text-muted">{profile.email}</p>}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ThemeToggle />
            <LocaleSelector />
            <button className="nc-btn nc-header-btn" type="button" onClick={scrollToHelp}>
              {t(resolveMsgKey(Msg.admin.help?.open, 'admin.help.open'))}
            </button>
            {profile && (
              <button className="nc-btn nc-header-btn" type="button" onClick={logout}>
                {t(Msg.common.signOut)}
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {token === null ? (
          <>
            <LoginForm error={error} onLogin={login} />
            <HelpPanel />
          </>
        ) : (
          <>
            {/* ── LLM 未設定アラート ── */}
            {isLlmConfigured === false && (
              <LlmUnconfiguredBanner onConfigureLlm={openLlmPanel} />
            )}
            {/* ── AI 設定（LLM 未設定だとチャット不可のため最優先） ── */}
            <section ref={llmPanelRef}>
              <LlmSettingsPanel
                token={token}
                isOpen={llmPanelOpen}
                onOpenChange={setLlmPanelOpen}
                onConfiguredChange={setIsLlmConfigured}
              />
            </section>
            <ChatSettingsPanel token={token} />
            <ChatLimitsPanel token={token} />
            {/* ── コンテンツ管理 ── */}
            <IngestionPanel token={token} onUploaded={() => setSourcesReloadKey((key) => key + 1)} />
            <SourcesPanel
              token={token}
              reloadKey={sourcesReloadKey}
              onDocumentsChanged={() => setSourcesReloadKey((key) => key + 1)}
            />
            {/* ── 運用監視 ── */}
            <ConversationLogsSummary
              token={token}
              onOpenLogs={() => setLogsOpen(true)}
            />
            {logsOpen && (
              <ConversationLogsPanel token={token} onClose={() => setLogsOpen(false)} />
            )}
            {/* ── デザイン ── */}
            <AppearancePanel token={token} />
            <HelpPanel />
          </>
        )}
      </main>
    </div>
  );
}
