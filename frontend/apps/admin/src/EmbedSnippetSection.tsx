import { useMemo, useState } from 'react';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { adminApiBase } from './config';
import { buildEmbedSnippet } from './embedSnippet';

export function EmbedSnippetSection() {
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
      setCopyError(t(Msg.admin.appearance.embedCopyFailed));
    }
  }

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <div>
        <h3 className="text-sm font-medium text-fg">{t(Msg.admin.appearance.embedTitle)}</h3>
        <p className="mt-1 text-sm nc-text-muted">{t(Msg.admin.appearance.embedSubtitle)}</p>
      </div>
      <pre className="overflow-x-auto rounded-admin border border-border bg-surface-muted p-3 text-xs leading-relaxed text-fg">
        {snippet}
      </pre>
      <div className="flex flex-wrap items-center gap-2">
        <button className="nc-btn-primary" type="button" onClick={() => void handleCopy()}>
          {copied ? t(Msg.admin.appearance.embedCopied) : t(Msg.admin.appearance.embedCopy)}
        </button>
        {copyError !== null && <p className="text-sm text-red-600">{copyError}</p>}
      </div>
    </div>
  );
}
