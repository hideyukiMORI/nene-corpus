import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Msg, useMsg } from '@nene-corpus/i18n';

const TOOLTIP_WIDTH_PX = 288;
const VIEWPORT_MARGIN_PX = 12;
const TOOLTIP_OFFSET_PX = 6;

export interface HelpLabelProps {
  label: string;
  help?: string;
  className?: string;
}

export function HelpLabel({ label, help, className = '' }: HelpLabelProps) {
  const t = useMsg();
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;

    if (button === null) {
      return;
    }

    const rect = button.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH_PX / 2;
    left = Math.max(
      VIEWPORT_MARGIN_PX,
      Math.min(left, window.innerWidth - TOOLTIP_WIDTH_PX - VIEWPORT_MARGIN_PX),
    );

    setCoords({
      top: rect.bottom + TOOLTIP_OFFSET_PX,
      left,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  if (help === undefined || help === '') {
    return <span className={className}>{label}</span>;
  }

  const tooltip =
    isOpen && coords !== null
      ? createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-50 w-72 max-w-[calc(100vw-1.5rem)] rounded-md border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-normal normal-case leading-relaxed tracking-normal whitespace-pre-line text-slate-600 shadow-lg"
            style={{ top: coords.top, left: coords.left }}
          >
            {help}
          </span>,
          document.body,
        )
      : null;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`.trim()}>
      <span>{label}</span>
      <span className="relative inline-flex">
        <button
          ref={buttonRef}
          type="button"
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-[10px] font-semibold leading-none text-slate-600 hover:border-slate-400 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
          aria-describedby={isOpen ? tooltipId : undefined}
          aria-expanded={isOpen}
          aria-label={`${t(Msg.common.showHelp)}: ${label}`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
        >
          ?
        </button>
      </span>
      {tooltip}
    </span>
  );
}
