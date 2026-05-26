import { useEffect, useState } from 'react';
import { Msg, resolveMsgKey, applyLocaleFontFamily, toBcp47, useLocale, useMsg } from '@nene-corpus/i18n';
import { getLlmSettings } from '@nene-corpus/api-client/llm-settings';
import { LoginForm, SourcesPanel } from './SourcesPanel';
import { IngestionPanel } from './IngestionPanel';
import { ConversationLogsPanel, ConversationLogsSummary } from './ConversationLogsPanel';
import { LlmUnconfiguredBanner } from './LlmUnconfiguredBanner';
import { SettingsModal } from './SettingsModal';
import type { SettingsSection } from './SettingsModal';
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

  // 設定モーダル
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('overview');

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

  function openSettings(section: SettingsSection = 'overview'): void {
    setSettingsSection(section);
    setSettingsOpen(true);
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
            {token !== null && (
              <button className="nc-btn nc-header-btn" type="button" onClick={() => openSettings('overview')}>
                {t(Msg.admin.app.settings)}
              </button>
            )}
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
              <LlmUnconfiguredBanner onConfigureLlm={() => openSettings('llm')} />
            )}
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
            <HelpPanel />
          </>
        )}
      </main>

      {/* ── 設定モーダル ── */}
      {settingsOpen && token !== null && (
        <SettingsModal
          token={token}
          initialSection={settingsSection}
          onClose={() => setSettingsOpen(false)}
          onLlmConfiguredChange={setIsLlmConfigured}
        />
      )}
    </div>
  );
}
