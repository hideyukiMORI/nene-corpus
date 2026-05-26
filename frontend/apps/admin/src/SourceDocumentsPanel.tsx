import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteDocument,
  getDocument,
  listDocumentChunks,
  listDocuments,
  updateDocument,
  type DocumentChunkItem,
  type DocumentListItem,
} from '@nene-corpus/api-client';
import { Msg, useMsg, type MessageParams, type MsgKey } from '@nene-corpus/i18n';
import { adminApiBase } from './config';

const PAGE_SIZE = 50;

interface SourceDocumentsPanelProps {
  token: string;
  sourceId: number;
  sourceName: string;
  onChanged: () => void;
  onClose: () => void;
}

function formatChunkMeta(
  chunk: DocumentChunkItem,
  t: (key: MsgKey, params?: MessageParams) => string,
): string {
  const parts: string[] = [
    t(Msg.admin.conversationLogs.citationChunk, { id: chunk.chunk_index + 1 }),
  ];

  if (chunk.page_number != null) {
    parts.push(t(Msg.admin.conversationLogs.citationPage, { page: chunk.page_number }));
  }

  if (chunk.section_label) {
    parts.push(chunk.section_label);
  }

  if (chunk.token_count != null) {
    parts.push(`${chunk.token_count} tokens`);
  }

  return parts.join(' · ');
}

export function SourceDocumentsPanel({
  token,
  sourceId,
  sourceName,
  onChanged,
  onClose,
}: SourceDocumentsPanelProps) {
  const t = useMsg();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [draftQuery, setDraftQuery] = useState('');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [chunks, setChunks] = useState<DocumentChunkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const loadDocuments = useCallback(
    async (currentOffset: number, currentQuery: string, signal?: AbortSignal): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listDocuments(token, sourceId, adminApiBase, {
          limit: PAGE_SIZE,
          offset: currentOffset,
          q: currentQuery,
        });

        if (signal?.aborted) {
          return;
        }

        setDocuments(response.documents);
        setTotal(response.total);
      } catch (cause: unknown) {
        if (!signal?.aborted) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.documents.loadFailed));
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [token, sourceId, t],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDocuments(offset, searchQuery, controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadDocuments, offset, searchQuery]);

  // モーダルの開閉制御
  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog === null) {
      return;
    }

    if (selectedId !== null) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [selectedId]);

  // ESC キーまたは backdrop クリックで閉じたとき
  function handleDialogCancel(): void {
    setSelectedId(null);
    setTitle('');
    setContent('');
    setChunks([]);
    setModalError(null);
    setModalSuccess(null);
  }

  function handleDialogClick(event: React.MouseEvent<HTMLDialogElement>): void {
    // backdrop 領域（dialog 要素そのもの）をクリックしたときだけ閉じる
    if (event.target === event.currentTarget) {
      handleDialogCancel();
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSelectedId(null);
    setTitle('');
    setContent('');
    setChunks([]);
    setOffset(0);
    setSearchQuery(draftQuery);
  }

  function handleClearSearch(): void {
    setDraftQuery('');
    setSelectedId(null);
    setTitle('');
    setContent('');
    setChunks([]);
    setOffset(0);
    setSearchQuery('');
    searchInputRef.current?.focus();
  }

  async function loadDocumentDetail(documentId: number): Promise<void> {
    setSelectedId(documentId);
    setModalError(null);
    setModalSuccess(null);
    setIsLoadingChunks(true);

    try {
      const [detail, chunkResponse] = await Promise.all([
        getDocument(token, documentId, adminApiBase),
        listDocumentChunks(token, documentId, adminApiBase),
      ]);
      setTitle(detail.title);
      setContent(detail.content);
      setChunks(chunkResponse.chunks);
    } catch (cause: unknown) {
      setModalError(cause instanceof Error ? cause.message : t(Msg.admin.documents.loadFailed));
      setChunks([]);
    } finally {
      setIsLoadingChunks(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (selectedId === null) {
      return;
    }

    setIsSaving(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      await updateDocument(
        token,
        selectedId,
        { title: title.trim(), content: content.trim() },
        adminApiBase,
      );
      setModalSuccess(t(Msg.admin.documents.saveSuccess));
      onChanged();
      const [response, chunkResponse] = await Promise.all([
        listDocuments(token, sourceId, adminApiBase, {
          limit: PAGE_SIZE,
          offset,
          q: searchQuery,
        }),
        listDocumentChunks(token, selectedId, adminApiBase),
      ]);
      setDocuments(response.documents);
      setTotal(response.total);
      setChunks(chunkResponse.chunks);
    } catch (cause: unknown) {
      setModalError(cause instanceof Error ? cause.message : t(Msg.admin.documents.saveFailed));
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
    setModalError(null);
    setModalSuccess(null);

    try {
      await deleteDocument(token, selectedId, adminApiBase);
      handleDialogCancel();
      onChanged();
      const response = await listDocuments(token, sourceId, adminApiBase, {
        limit: PAGE_SIZE,
        offset,
        q: searchQuery,
      });
      setDocuments(response.documents);
      setTotal(response.total);
      setSuccess(t(Msg.admin.documents.deleteSuccess));
    } catch (cause: unknown) {
      setModalError(cause instanceof Error ? cause.message : t(Msg.admin.documents.deleteFailed));
    } finally {
      setIsDeleting(false);
    }
  }

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE_SIZE, total);
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <section className="border-t border-accent-border bg-accent px-4 py-4">
      {/* パネルヘッダー */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-medium text-fg">{t(Msg.admin.documents.title)}</h3>
          <p className="text-xs nc-text-muted">{sourceName}</p>
        </div>
        <button className="nc-btn" type="button" onClick={onClose}>
          {t(Msg.admin.documents.close)}
        </button>
      </div>

      {/* 検索バー */}
      <form className="mb-3 flex gap-2" onSubmit={handleSearch}>
        <input
          ref={searchInputRef}
          className="nc-input flex-1 py-1 text-sm"
          type="search"
          placeholder={t(Msg.admin.documents.searchPlaceholder)}
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
        <button className="nc-btn text-xs" type="submit">
          {t(Msg.admin.documents.searchPlaceholder).replace('…', '')}
        </button>
        {searchQuery !== '' && (
          <button className="nc-btn text-xs" type="button" onClick={handleClearSearch}>
            {t(Msg.admin.documents.searchClear)}
          </button>
        )}
      </form>

      {/* ドキュメント一覧 */}
      {isLoading ? (
        <p className="text-sm nc-text-muted">{t(Msg.common.loading)}</p>
      ) : documents.length === 0 ? (
        <p className="text-sm nc-text-muted">{t(Msg.admin.documents.empty)}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="space-y-2">
            {documents.map((document) => (
              <li key={document.document_id}>
                <button
                  className="w-full rounded-admin border border-accent-border bg-surface/70 px-3 py-2 text-left text-sm hover:bg-surface"
                  type="button"
                  onClick={() => void loadDocumentDetail(document.document_id)}
                >
                  <div className="font-medium text-fg break-words">{document.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs nc-text-muted">{document.content_preview}</div>
                </button>
              </li>
            ))}
          </ul>

          {/* ページネーション */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-2 pt-1 text-xs nc-text-muted">
              <span>
                {t(Msg.admin.documents.pageInfo, { from, to, total })}
              </span>
              <div className="flex gap-1">
                <button
                  className="nc-btn text-xs disabled:opacity-40"
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  {t(Msg.admin.documents.pagePrev)}
                </button>
                <button
                  className="nc-btn text-xs disabled:opacity-40"
                  type="button"
                  disabled={!hasNext}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  {t(Msg.admin.documents.pageNext)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error !== null && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success !== null && <p className="mt-3 text-sm text-emerald-700">{success}</p>}

      {/* 編集モーダル */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click handled by dialog cancel */}
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-2xl rounded-admin bg-surface p-0 shadow-xl backdrop:bg-black/40"
        onCancel={handleDialogCancel}
        onClick={handleDialogClick}
      >
        <div className="flex max-h-[90vh] flex-col overflow-hidden">
          {/* モーダルヘッダー */}
          <div className="flex items-center justify-between border-b border-accent-border px-5 py-3">
            <h2 className="text-sm font-semibold text-fg">{t(Msg.admin.documents.fieldTitle)}</h2>
            <button
              className="nc-btn text-xs"
              type="button"
              onClick={handleDialogCancel}
              aria-label={t(Msg.admin.documents.close)}
            >
              ✕
            </button>
          </div>

          {/* モーダルボディ */}
          <div className="overflow-y-auto px-5 py-4">
            {isLoadingChunks ? (
              <p className="text-sm nc-text-muted">{t(Msg.common.loading)}</p>
            ) : (
              <>
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
                    <button
                      className="nc-btn"
                      type="button"
                      disabled={isDeleting}
                      onClick={() => void handleDelete()}
                    >
                      {isDeleting ? t(Msg.admin.documents.deleting) : t(Msg.admin.documents.delete)}
                    </button>
                  </div>
                </form>

                {/* チャンクプレビュー */}
                <section className="mt-5 border-t border-accent-border pt-4">
                  <h4 className="text-sm font-medium text-fg">{t(Msg.admin.documents.chunksTitle)}</h4>
                  {chunks.length === 0 ? (
                    <p className="mt-2 text-sm nc-text-muted">{t(Msg.admin.documents.chunksEmpty)}</p>
                  ) : (
                    <ol className="mt-2 space-y-2">
                      {chunks.map((chunk) => (
                        <li
                          key={chunk.chunk_id}
                          className="rounded-admin border border-accent-border bg-surface/70 px-3 py-2"
                        >
                          <div className="break-words text-xs nc-text-muted">{formatChunkMeta(chunk, t)}</div>
                          <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-fg">{chunk.content}</pre>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>

                {modalError !== null && <p className="mt-3 text-sm text-red-600">{modalError}</p>}
                {modalSuccess !== null && <p className="mt-3 text-sm text-emerald-700">{modalSuccess}</p>}
              </>
            )}
          </div>
        </div>
      </dialog>
    </section>
  );
}
