import { useId, useState } from 'react';
import { Msg, useMsg } from '@nene-corpus/i18n';

export interface HelpLabelProps {
  label: string;
  help?: string;
  className?: string;
}

export function HelpLabel({ label, help, className = '' }: HelpLabelProps) {
  const t = useMsg();
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);

  if (help === undefined || help === '') {
    return <span className={className}>{label}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`.trim()}>
      <span>{label}</span>
      <span className="relative inline-flex">
        <button
          type="button"
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-[10px] font-semibold leading-none text-slate-600 hover:border-slate-400 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
          aria-describedby={tooltipId}
          aria-expanded={isOpen}
          aria-label={`${t(Msg.common.showHelp)}: ${label}`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
        >
          ?
        </button>
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-56 -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-left text-xs font-normal normal-case tracking-normal text-slate-600 shadow-lg ${
            isOpen ? 'block' : 'hidden'
          }`}
        >
          {help}
        </span>
      </span>
    </span>
  );
}
