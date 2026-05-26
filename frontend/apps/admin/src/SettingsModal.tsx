import { useEffect, useRef, useState } from 'react';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { LlmSettingsPanel } from './LlmSettingsPanel';
import { ChatSettingsPanel } from './ChatSettingsPanel';
import { ChatLimitsPanel } from './ChatLimitsPanel';

export type SettingsSection = 'llm' | 'chat' | 'limits';

interface SettingsModalProps {
  token: string;
  initialSection?: SettingsSection;
  onClose: () => void;
  onLlmConfiguredChange?: (configured: boolean) => void;
}

interface NavItem {
  id: SettingsSection;
  msgKey: typeof Msg.admin.app.settingsNavLlm | typeof Msg.admin.app.settingsNavChat | typeof Msg.admin.app.settingsNavLimits;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'llm',    msgKey: Msg.admin.app.settingsNavLlm },
  { id: 'chat',   msgKey: Msg.admin.app.settingsNavChat },
  { id: 'limits', msgKey: Msg.admin.app.settingsNavLimits },
];

export function SettingsModal({ token, initialSection = 'llm', onClose, onLlmConfiguredChange }: SettingsModalProps) {
  const t = useMsg();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  // initialSection が変わったとき（バナーから特定セクションを開く用途）に追従
  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  // <dialog> をマウント時に showModal() で開く
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (!el.open) el.showModal();

    function handleCancel(e: Event) {
      e.preventDefault(); // ESC で閉じないようにしてから自前で閉じる
      onClose();
    }
    el.addEventListener('cancel', handleCancel);
    return () => el.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  // backdrop クリックで閉じる
  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-0 h-screen max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-black/50"
      onClick={handleDialogClick}
    >
      {/* モーダル本体 */}
      <div className="flex h-full flex-col bg-bg text-fg sm:flex-row">
        {/* ── サイドナビ ── */}
        <nav className="shrink-0 border-b border-border sm:w-48 sm:border-b-0 sm:border-r">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:border-b-0 sm:pb-2 sm:pt-6">
            <span className="font-semibold text-fg">{t(Msg.admin.app.settings)}</span>
            <button
              type="button"
              className="text-xl leading-none nc-text-muted hover:text-fg sm:hidden"
              aria-label={t(Msg.admin.app.settingsClose)}
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          <ul className="flex gap-1 overflow-x-auto px-2 py-2 sm:flex-col sm:overflow-x-visible sm:py-4">
            {NAV_ITEMS.map(({ id, msgKey }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                    activeSection === id
                      ? 'bg-brand/10 font-medium text-brand'
                      : 'nc-text-muted hover:bg-surface-hover hover:text-fg'
                  }`}
                >
                  {t(msgKey)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── コンテンツエリア ── */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* ヘッダー（閉じるボタン） */}
          <div className="sticky top-0 z-10 hidden items-center justify-end border-b border-border bg-bg/80 px-4 py-3 backdrop-blur-md sm:flex">
            <button
              type="button"
              className="nc-btn nc-header-btn"
              onClick={onClose}
            >
              {t(Msg.admin.app.settingsClose)}
            </button>
          </div>

          {/* パネル本体（各パネルの nc-panel スタイルをそのまま使う） */}
          <div className="mx-auto max-w-3xl px-4 py-6">
            {activeSection === 'llm' && (
              <LlmSettingsPanel
                token={token}
                isOpen={true}
                onOpenChange={() => { /* モーダル内では常に展開 */ }}
                onConfiguredChange={onLlmConfiguredChange}
              />
            )}
            {activeSection === 'chat' && (
              <ChatSettingsPanel token={token} />
            )}
            {activeSection === 'limits' && (
              <ChatLimitsPanel
                token={token}
                isOpen={true}
                onOpenChange={() => { /* モーダル内では常に展開 */ }}
              />
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
