import { useEffect, useRef, useState } from 'react';
import { Msg, applyLocaleFontFamily, useLocale, useMsg, type MsgKey, type SupportedLocale } from '@/shared/i18n';

const LOCALE_OPTIONS: { code: SupportedLocale; flag: string; labelKey: MsgKey }[] = [
  { code: 'ja',      flag: '🇯🇵', labelKey: Msg.locale.ja },
  { code: 'en',      flag: '🇺🇸', labelKey: Msg.locale.en },
  { code: 'de',      flag: '🇩🇪', labelKey: Msg.locale.de },
  { code: 'fr',      flag: '🇫🇷', labelKey: Msg.locale.fr },
  { code: 'zh-Hans', flag: '🇨🇳', labelKey: Msg.locale.zhHans },
  { code: 'pt-BR',   flag: '🇧🇷', labelKey: Msg.locale.ptBr },
];

export function LocaleSelector() {
  const t = useMsg();
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  /* ドロップダウン外クリックで閉じる */
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  /* Escape キーで閉じる */
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  function handleSelect(code: SupportedLocale) {
    setLocale(code);
    applyLocaleFontFamily(code);
    setOpen(false);
  }

  return (
    <div className="locale-selector" ref={rootRef}>
      <button
        type="button"
        className="locale-trigger icon-btn"
        aria-label={t(Msg.admin.app.language)}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <GlobeIcon />
        <span className="locale-code">{locale}</span>
      </button>

      {open && (
        <ul
          className="locale-dropdown"
          role="listbox"
          aria-label={t(Msg.admin.app.language)}
        >
          {LOCALE_OPTIONS.map(({ code, flag, labelKey }) => (
            <li
              key={code}
              role="option"
              aria-selected={code === locale}
              className={`locale-option${code === locale ? ' selected' : ''}`}
              onClick={() => handleSelect(code)}
            >
              <span className="locale-flag">{flag}</span>
              <span className="locale-label">{t(labelKey)}</span>
              {code === locale && <CheckIcon />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Inline SVG icons ── */
function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="locale-check">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
