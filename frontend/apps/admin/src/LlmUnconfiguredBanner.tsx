import { Msg, useMsg } from '@nene-corpus/i18n';

interface LlmUnconfiguredBannerProps {
  onConfigureLlm: () => void;
}

export function LlmUnconfiguredBanner({ onConfigureLlm }: LlmUnconfiguredBannerProps) {
  const t = useMsg();

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-admin border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
    >
      <span>⚠ {t(Msg.admin.llm.alertBody)}</span>
      <button
        type="button"
        className="shrink-0 rounded border border-amber-400 bg-amber-100 px-3 py-1 text-xs font-medium hover:bg-amber-200 dark:border-amber-600 dark:bg-amber-900 dark:hover:bg-amber-800"
        onClick={onConfigureLlm}
      >
        {t(Msg.admin.llm.alertCta)}
      </button>
    </div>
  );
}
