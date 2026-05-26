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

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
const DEFAULT_PAGE_SIZE = 50;

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

  // --- 一覧ステート ---
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(DEFAULT_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listSuccess, setListSuccess] = useState<string | null>(null);

  // --- 編集パネルステート ---
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [chunks, setChunks] = useState<DocumentChunkItem[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // ページネーション派生値
  const currentPage = total === 0 ? 1 : Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + pageSize, total);
  const hasPrev = offset > 0;
  const hasNext = offset + pageSize < total;

  // モーダルをマウント時に開く
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const loadDocuments = useCallback(
    async (
      currentOffset: number,
      currentQuery: string,
      currentPageSize: number,
      signal?: AbortSignal,
    ): Promise<void> => {
      setIsLoading(true);
      setListError(null);

      try {
        const response = await listDocuments(token, sourceId, adminApiBase, {
          limit: currentPageSize,
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
          setListError(cause instanceof Error ? cause.message : t(Msg.admin.documents.loadFailed));
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
    void loadDocuments(offset, searchQuery, pageSize, controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadDocuments, offset, searchQuery, pageSize]);

  function clearSelection(): void {
    setSelectedId(null);
    setTitle('');
    setContent('');
    setChunks([]);
    setEditError(null);
    setEditSuccess(null);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    clearSelection();
    setOffset(0);
    setSearchQuery(draftQuery);
  }

  function handleClearSearch(): void {
    setDraftQuery('');
    clearSelection();
    setOffset(0);
    setSearchQuery('');
    searchInputRef.current?.focus();
  }

  function handlePageSizeChange(newSize: (typeof PAGE_SIZE_OPTIONS)[number]): void {
    setPageSize(newSize);
    setOffset(0);
    clearSelection();
  }

  function handlePageInputBlur(event: React.FocusEvent<HTMLInputElement>): void {
    const parsed = parseInt(event.target.value, 10);

    if (!isNaN(parsed)) {
      const clamped = Math.max(1, Math.min(totalPages, parsed));
      setOffset((clamped - 1) * pageSize);
    }
  }

  function handlePageInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }

  async function loadDocumentDetail(documentId: number): Promise<void> {
    setSelectedId(documentId);
    setEditError(null);
    setEditSuccess(null);
    setListSuccess(null);
    setIsLoadingDetail(true);

    try {
      const [detail, chunkResponse] = await Promise.all([
        getDocument(token, documentId, adminApiBase),
        listDocumentChunks(token, documentId, adminApiBase),
      ]);
      setTitle(detail.title);
      setContent(detail.content);
      setChunks(chunkResponse.chunks);
    } catch (cause: unknown) {
      setEditError(cause instanceof Error ? cause.message : t(Msg.admin.documents.loadFailed));
      setChunks([]);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (selectedId === null) {
      return;
    }

    setIsSaving(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      await updateDocument(
        token,
        selectedId,
        { title: title.trim(), content: content.trim() },
        adminApiBase,
      );
      setEditSuccess(t(Msg.admin.documents.saveSuccess));
      onChanged();

      const [response, chunkResponse] = await Promise.all([
        listDocuments(token, sourceId, adminApiBase, {
          limit: pageSize,
          offset,
          q: searchQuery,
        }),
        listDocumentChunks(token, selectedId, adminApiBase),
      ]);

      setDocuments(response.documents);
      setTotal(response.total);
      setChunks(chunkResponse.chunks);
    } catch (cause: unknown) {
      setEditError(cause instanceof Error ? cause.message : t(Msg.admin.documents.saveFailed));
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
    setEditError(null);
    setEditSuccess(null);

    try {
      await deleteDocument(token, selectedId, adminApiBase);
      clearSelection();
      onChanged();

      const response = await listDocuments(token, sourceId, adminApiBase, {
        limit: pageSize,
        offset,
        q: searchQuery,
      });

      setDocuments(response.documents);
      setTotal(response.total);
      setListSuccess(t(Msg.admin.documents.deleteSuccess));
    } catch (cause: unknown) {
      setEditError(cause instanceof Error ? cause.message : t(Msg.admin.documents.deleteFailed));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click handled by dialog cancel
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-5xl rounded-admin bg-surface p-0 shadow-xl backdrop:bg-black/40"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {/* 内側コンテナ：デスクトップでは max-h で高さ制限し列ごとにスクロール */}
      <div className="flex flex-col md:max-h-[90vh] md:overflow-hidden">

        {/* ヘッダー */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-fg">{t(Msg.admin.documents.title)}</h2>
            <p className="truncate text-xs nc-text-muted">{sourceName}</p>
          </div>
          <button
            className="nc-btn ml-4 shrink-0 text-xs"
            type="button"
            onClick={onClose}
            aria-label={t(Msg.admin.documents.close)}
          >
            ✕
          </button>
        </div>

        {/* ボディ：2 カラム */}
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">

          {/* 左カラム：ドキュメント一覧 */}
          <div className="flex flex-col overflow-hidden border-b border-border md:border-b-0 md:border-r">

            {/* 検索フォーム */}
            <form
              className="shrink-0 flex gap-2 border-b border-border px-3 py-2"
              onSubmit={handleSearch}
            >
              <input
                ref={searchInputRef}
                className="nc-input flex-1 py-1 text-sm"
                type="search"
                placeholder={t(Msg.admin.documents.searchPlaceholder)}
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
              />
              <button className="nc-btn text-xs" type="submit">
                {t(Msg.admin.documents.searchPlaceholder).replace('…', '').trim()}
              </button>
              {searchQuery !== '' && (
                <button className="nc-btn text-xs" type="button" onClick={handleClearSearch}>
                  {t(Msg.admin.documents.searchClear)}
                </button>
              )}
            </form>

            {/* リスト */}
            <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
              {isLoading ? (
                <p className="text-sm nc-text-muted">{t(Msg.common.loading)}</p>
              ) : documents.length === 0 ? (
                <p className="text-sm nc-text-muted">{t(Msg.admin.documents.empty)}</p>
              ) : (
                documents.map((document) => (
                  <button
                    key={document.document_id}
                    className={`w-full rounded-admin border px-3 py-2 text-left text-sm transition-colors ${
                      selectedId === document.document_id
                        ? 'border-accent-border bg-accent'
                        : 'border-border bg-surface hover:bg-surface-muted'
                    }`}
                    type="button"
                    onClick={() => void loadDocumentDetail(document.document_id)}
                  >
                    <div className="break-words font-medium text-fg">{document.title}</div>
                    <div className="mt-0.5 line-clamp-1 text-xs nc-text-muted">
                      {document.content_preview}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* フッター：件数 + 表示件数 + ページナビ */}
            {total > 0 && (
              <div className="shrink-0 space-y-1.5 border-t border-border px-3 py-2">
                {/* 行 1: 件数 + 表示件数セレクタ */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs nc-text-muted">
                    {t(Msg.admin.documents.pageInfo, { from, to, total })}
                  </span>
                  <select
                    aria-label={t(Msg.admin.documents.perPageLabel)}
                    className="rounded-admin border border-border bg-surface py-0.5 pl-1.5 pr-6 text-xs text-fg"
                    value={pageSize}
                    onChange={(event) =>
                      handlePageSizeChange(
                        Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number],
                      )
                    }
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 行 2: ページナビ（複数ページの場合のみ） */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      className="nc-btn text-xs disabled:opacity-40"
                      type="button"
                      disabled={!hasPrev}
                      onClick={() => setOffset(Math.max(0, offset - pageSize))}
                    >
                      {t(Msg.admin.documents.pagePrev)}
                    </button>
                    <input
                      key={currentPage}
                      type="number"
                      defaultValue={currentPage}
                      min={1}
                      max={totalPages}
                      className="w-12 rounded-admin border border-border bg-surface px-1 py-0.5 text-center text-xs text-fg"
                      onBlur={handlePageInputBlur}
                      onKeyDown={handlePageInputKeyDown}
                    />
                    <span className="text-xs nc-text-muted">/ {totalPages}</span>
                    <button
                      className="nc-btn text-xs disabled:opacity-40"
                      type="button"
                      disabled={!hasNext}
                      onClick={() => setOffset(offset + pageSize)}
                    >
                      {t(Msg.admin.documents.pageNext)}
                    </button>
                  </div>
                )}
              </div>
            )}

            {listError !== null && (
              <p className="shrink-0 px-3 pb-3 text-sm text-red-600">{listError}</p>
            )}
            {listSuccess !== null && (
              <p className="shrink-0 px-3 pb-3 text-sm text-emerald-700">{listSuccess}</p>
            )}
          </div>

          {/* 右カラム：編集パネル */}
          <div className="overflow-y-auto px-5 py-4">
            {selectedId === null ? (
              <p className="nc-text-muted text-sm">{t(Msg.admin.documents.selectDocument)}</p>
            ) : isLoadingDetail ? (
              <p className="nc-text-muted text-sm">{t(Msg.common.loading)}</p>
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
                  {editError !== null && (
                    <p className="text-sm text-red-600">{editError}</p>
                  )}
                  {editSuccess !== null && (
                    <p className="text-sm text-emerald-700">{editSuccess}</p>
                  )}
                </form>

                {/* チャンクプレビュー */}
                <section className="mt-5 border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-fg">
                    {t(Msg.admin.documents.chunksTitle)}
                  </h4>
                  {chunks.length === 0 ? (
                    <p className="mt-2 text-sm nc-text-muted">
                      {t(Msg.admin.documents.chunksEmpty)}
                    </p>
                  ) : (
                    <ol className="mt-2 space-y-2">
                      {chunks.map((chunk) => (
                        <li
                          key={chunk.chunk_id}
                          className="rounded-admin border border-accent-border bg-surface/70 px-3 py-2"
                        >
                          <div className="break-words text-xs nc-text-muted">
                            {formatChunkMeta(chunk, t)}
                          </div>
                          <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-fg">
                            {chunk.content}
                          </pre>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
