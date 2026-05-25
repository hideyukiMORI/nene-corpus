import { FormEvent, useEffect, useState } from 'react';
import {
  deleteDocument,
  getDocument,
  listDocuments,
  updateDocument,
  type DocumentListItem,
} from '@nene-corpus/api-client';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { adminApiBase } from './config';

interface SourceDocumentsPanelProps {
  token: string;
  sourceId: number;
  sourceName: string;
  onChanged: () => void;
  onClose: () => void;
}

export function SourceDocumentsPanel({
  token,
  sourceId,
  sourceName,
  onChanged,
  onClose,
}: SourceDocumentsPanelProps) {
  const t = useMsg();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listDocuments(token, sourceId, adminApiBase);
        if (!cancelled) {
          setDocuments(response.documents);
          setSelectedId(null);
          setTitle('');
          setContent('');
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.documents.loadFailed));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [token, sourceId, t]);

  async function handleSelect(documentId: number): Promise<void> {
    setSelectedId(documentId);
    setError(null);
    setSuccess(null);

    try {
      const detail = await getDocument(token, documentId, adminApiBase);
      setTitle(detail.title);
      setContent(detail.content);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.documents.loadFailed));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (selectedId === null) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateDocument(
        token,
        selectedId,
        { title: title.trim(), content: content.trim() },
        adminApiBase,
      );
      setSuccess(t(Msg.admin.documents.saveSuccess));
      onChanged();
      const response = await listDocuments(token, sourceId, adminApiBase);
      setDocuments(response.documents);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.documents.saveFailed));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (selectedId === null) {
      return;
    }

    if (!window.confirm(t(Msg.admin.documents.deleteConfirm))) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteDocument(token, selectedId, adminApiBase);
      setSuccess(t(Msg.admin.documents.deleteSuccess));
      setSelectedId(null);
      setTitle('');
      setContent('');
      onChanged();
      const response = await listDocuments(token, sourceId, adminApiBase);
      setDocuments(response.documents);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.documents.deleteFailed));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="border-t border-accent-border bg-accent px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-medium text-fg">{t(Msg.admin.documents.title)}</h3>
          <p className="text-xs nc-text-muted">{sourceName}</p>
        </div>
        <button className="nc-btn" type="button" onClick={onClose}>
          {t(Msg.admin.documents.close)}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm nc-text-muted">{t(Msg.common.loading)}</p>
      ) : documents.length === 0 ? (
        <p className="text-sm nc-text-muted">{t(Msg.admin.documents.empty)}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <ul className="space-y-2">
            {documents.map((document) => (
              <li key={document.document_id}>
                <button
                  className={`w-full rounded-admin border px-3 py-2 text-left text-sm ${
                    selectedId === document.document_id
                      ? 'border-focus bg-surface text-fg'
                      : 'border-accent-border bg-surface/70 text-fg-muted hover:bg-surface'
                  }`}
                  type="button"
                  onClick={() => void handleSelect(document.document_id)}
                >
                  <div className="font-medium text-fg">{document.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs nc-text-muted">{document.content_preview}</div>
                </button>
              </li>
            ))}
          </ul>

          {selectedId !== null ? (
            <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
              <label className="block text-sm">
                <span className="font-medium text-fg">{t(Msg.admin.documents.fieldTitle)}</span>
                <input
                  className="nc-input mt-1"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-fg">{t(Msg.admin.documents.fieldContent)}</span>
                <textarea
                  className="nc-input mt-1 min-h-48 font-mono text-xs"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  required
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button className="nc-btn-primary" type="submit" disabled={isSaving}>
                  {isSaving ? t(Msg.admin.documents.saving) : t(Msg.admin.documents.save)}
                </button>
                <button className="nc-btn" type="button" disabled={isDeleting} onClick={() => void handleDelete()}>
                  {isDeleting ? t(Msg.admin.documents.deleting) : t(Msg.admin.documents.delete)}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm nc-text-muted">{t(Msg.admin.documents.selectPrompt)}</p>
          )}
        </div>
      )}

      {error !== null && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success !== null && <p className="mt-3 text-sm text-emerald-700">{success}</p>}
    </section>
  );
}
