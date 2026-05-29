/**
 * SourcesPage — v2 リデザイン実装 (#262)
 *
 * セクション:
 *   01 新しいソースを追加 (ファイル / テキスト segmented switch + dropzone)
 *   02 登録済みのソース 一覧 (左) + 選択ソースの chunk preview (右)
 */
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  createSource,
  deleteSource,
  updateSource,
  reindexSource,
  listDocuments,
  listDocumentChunks,
  listSources,
  previewCsvIngestion,
  previewPdfIngestion,
  type CsvColumnMapping,
  type DocumentChunkItem,
  type DocumentListItem,
  type PreviewCsvIngestionResponse,
  type PreviewPdfIngestionResponse,
  type SourceListItem,
} from '@nene-corpus/api-client';
import { adminApiBase } from '../../config';
import { detectSourceType, readFileAsBase64 } from '../../fileBase64';
import { ConfirmDialog } from '../../ConfirmDialog';
import { Layout } from '../Layout';

// ── SVG アイコン ────────────────────────────────────────────────────

function IconUpload({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function IconFile({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

function IconDownload({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function IconTrash({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
    </svg>
  );
}

function IconX({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconPencil({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

// ── 型 ────────────────────────────────────────────────────────────

type UploadMode = 'file' | 'text';

interface SourcesPageProps {
  token: string;
  onLogout?: () => void;
}

// ── SourcesPage (メイン) ──────────────────────────────────────────

export function SourcesPage({ token, onLogout }: SourcesPageProps) {
  const [sources, setSources] = useState<SourceListItem[]>([]);
  const [totalSources, setTotalSources] = useState(0);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceListItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // フィルター
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 削除
  const [confirmTarget, setConfirmTarget] = useState<SourceListItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 編集 (#3)
  const [editTarget, setEditTarget] = useState<SourceListItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editReindex, setEditReindex] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function openEdit(source: SourceListItem) {
    setEditTarget(source);
    setEditName(source.name);
    setEditNote(source.note ?? '');
    setEditReindex(false);
    setEditError(null);
  }

  async function handleEditSave() {
    if (editTarget === null) return;
    const name = editName.trim();
    if (name === '') {
      setEditError('ソース名を入力してください。');
      return;
    }
    setIsSavingEdit(true);
    setEditError(null);
    try {
      await updateSource(token, editTarget.source_id, { name, note: editNote.trim() || null }, adminApiBase);
      if (editReindex) {
        await reindexSource(token, editTarget.source_id, adminApiBase);
      }
      setEditTarget(null);
      setReloadKey(k => k + 1);
    } catch (cause: unknown) {
      setEditError(cause instanceof Error ? cause.message : '保存に失敗しました。');
    } finally {
      setIsSavingEdit(false);
    }
  }

  // コーパスステータス文字列（動的）
  const readyCount = sources.filter(s => s.status === 'ready').length;
  const corpusStatus = `${readyCount} / ${totalSources} 取り込み済み`;

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingSources(true);
    setSourcesError(null);
    try {
      const response = await listSources(token, adminApiBase, { limit: 200, offset: 0 });
      if (signal?.aborted) return;
      setSources(response.sources);
      setTotalSources(response.total);
    } catch (cause: unknown) {
      if (!signal?.aborted) {
        setSourcesError(cause instanceof Error ? cause.message : 'ソースの読み込みに失敗しました。');
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoadingSources(false);
      }
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  function handleUploaded() {
    setReloadKey(k => k + 1);
  }

  async function handleDeleteConfirmed() {
    if (confirmTarget === null) return;
    const target = confirmTarget;
    setDeletingId(target.source_id);
    setConfirmTarget(null);
    if (selectedSource?.source_id === target.source_id) {
      setSelectedSource(null);
    }
    try {
      await deleteSource(token, target.source_id, adminApiBase);
      setReloadKey(k => k + 1);
    } catch {
      // エラーは無視（後続のリロードで状態を反映）
    } finally {
      setDeletingId(null);
    }
  }

  // フィルタリング済みソース
  const filteredSources = sources.filter(source => {
    if (filterType !== 'all' && source.source_type !== filterType) return false;
    if (filterStatus !== 'all') {
      const statusMap: Record<string, string[]> = {
        ready: ['ready'],
        processing: ['pending', 'processing'],
        failed: ['failed'],
      };
      if (!(statusMap[filterStatus] ?? []).includes(source.status)) return false;
    }
    if (searchQuery.trim() !== '' && !source.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // chunk 合計
  const totalChunks = sources.reduce((sum, s) => sum + s.chunk_count, 0);
  const sectionRight = `${readyCount} / ${totalSources} · ${totalChunks} chunks total`;

  return (
    <Layout
      active="sources"
      crumb="ソース"
      corpusStatus={corpusStatus}
      modelStatus="bad"
      stats="86 セッション · 428 通 · 引用 91.8%"
      onLogout={onLogout}
    >
      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <span>Sources</span>
            <span className="sep"></span>
            <span className="scope">コーパス管理</span>
          </div>
          <h1>ソース</h1>
          <div className="desc">CSV・PDF・テキストをアップロードして、検索可能なコーパスを構築します。</div>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost">
            <IconDownload size={13} />
            CSV エクスポート
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              const el = document.getElementById('upload-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ソースを追加
          </button>
        </div>
      </div>

      {/* ══ 01 アップロード ══════════════════════════════════════════ */}
      <div id="upload-section" className="section-head">
        <span className="num">01</span>
        <h2>新しいソースを追加</h2>
        <span className="en">// upload</span>
        <span className="rule"></span>
      </div>

      <UploadSection token={token} onUploaded={handleUploaded} />

      {/* ══ 02 登録済みのソース ════════════════════════════════════════ */}
      <div className="section-head" style={{ marginTop: 32 }}>
        <span className="num">02</span>
        <h2>登録済みのソース</h2>
        <span className="en">// indexed</span>
        <span className="rule"></span>
        <span className="right">{isLoadingSources ? '読み込み中…' : sectionRight}</span>
      </div>

      {sourcesError !== null && (
        <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{sourcesError}</p>
      )}

      <div className="sources-layout">
        {/* 左: ソース一覧 */}
        <div>
          {/* フィルタバー */}
          <div className="filterbar">
            <span className="lbl">種別:</span>
            <select
              className="sel"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="all">すべて</option>
              <option value="csv">csv</option>
              <option value="pdf">pdf</option>
              <option value="text">text</option>
            </select>
            <span className="lbl">状態:</span>
            <select
              className="sel"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">すべて</option>
              <option value="ready">取り込み済み</option>
              <option value="processing">取り込み中</option>
              <option value="failed">失敗</option>
            </select>
            <input
              type="text"
              placeholder="名前で検索..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <span className="count">{filteredSources.length} 件</span>
          </div>

          <div
            className="panel src-table"
            style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}
          >
            {isLoadingSources ? (
              <p style={{ padding: '20px 16px', color: 'var(--ink-muted)', fontSize: 13 }}>読み込み中…</p>
            ) : filteredSources.length === 0 ? (
              <p style={{ padding: '20px 16px', color: 'var(--ink-muted)', fontSize: 13 }}>
                {sources.length === 0 ? 'ソースがありません。最初のソースを追加してください。' : '条件に一致するソースがありません。'}
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>種別</th>
                    <th>名前</th>
                    <th style={{ width: 110 }}>状態</th>
                    <th className="num" style={{ width: 70 }}>chunks</th>
                    <th style={{ width: 100 }}>更新</th>
                    <th style={{ width: 72 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSources.map(source => (
                    <SourceRow
                      key={source.source_id}
                      source={source}
                      isSelected={selectedSource?.source_id === source.source_id}
                      isDeleting={deletingId === source.source_id}
                      onClick={() => setSelectedSource(source)}
                      onDelete={() => setConfirmTarget(source)}
                      onEdit={() => openEdit(source)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 右: detail ペイン */}
        {selectedSource !== null ? (
          <SourceDetailPane
            key={selectedSource.source_id}
            token={token}
            source={selectedSource}
          />
        ) : (
          <div
            className="panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
            }}
          >
            <p style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
              ソースを選択すると詳細が表示されます。
            </p>
          </div>
        )}
      </div>

      {/* ソース編集モーダル (#3) */}
      {editTarget !== null && (
        <div
          className="modal-backdrop"
          onClick={() => { if (!isSavingEdit) setEditTarget(null); }}
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                ソースを編集 <span className="en">// edit source</span>
              </h3>
              <button className="modal-close" type="button" onClick={() => setEditTarget(null)} aria-label="閉じる">
                <IconX size={14} />
              </button>
            </div>
            <div className="modal-body">
              {editError !== null && (
                <div className="warn-note" style={{ marginBottom: 12 }}>{editError}</div>
              )}
              <div className="field">
                <label className="field-label">
                  ソース名 <span className="en">name</span> <span className="req">*</span>
                </label>
                <input
                  className="field-input"
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  disabled={isSavingEdit}
                  autoFocus
                />
              </div>
              <div className="field">
                <label className="field-label">
                  メモ <span className="en">note</span>
                </label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="社内向けの補足 (任意)"
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  disabled={isSavingEdit}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">
                  再取り込み <span className="en">re-index</span>
                </label>
                <div className="field-row-toggle" style={{ border: '1px solid var(--hair)', borderRadius: 6, padding: '10px 12px' }}>
                  <div className="body">
                    <div className="title">保存時にチャンクを作り直す</div>
                    <div className="desc">名前の変更だけなら不要です。元ファイルから再生成したい場合にオンにしてください。</div>
                  </div>
                  <button
                    type="button"
                    className={editReindex ? 'toggle on' : 'toggle'}
                    role="switch"
                    aria-checked={editReindex}
                    aria-label="再取り込み"
                    disabled={isSavingEdit}
                    onClick={() => setEditReindex(v => !v)}
                  />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" type="button" onClick={() => setEditTarget(null)} disabled={isSavingEdit}>
                キャンセル
              </button>
              <button className="btn btn-primary" type="button" onClick={() => void handleEditSave()} disabled={isSavingEdit}>
                {isSavingEdit ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {confirmTarget !== null && (
        <ConfirmDialog
          title="ソースを削除"
          description={`「${confirmTarget.name}」を削除しますか？\n関連するドキュメントとチャンクもすべて削除されます。この操作は取り消せません。`}
          confirmLabel="削除する"
          variant="danger"
          isConfirming={deletingId === confirmTarget.source_id}
          onConfirm={() => void handleDeleteConfirmed()}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </Layout>
  );
}

// ── SourceRow ────────────────────────────────────────────────────

interface SourceRowProps {
  source: SourceListItem;
  isSelected: boolean;
  isDeleting: boolean;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function SourceRow({ source, isSelected, isDeleting, onClick, onDelete, onEdit }: SourceRowProps) {
  const typeLabel = source.source_type === 'text' ? 'txt' : source.source_type;
  const updatedDate = formatDate(source.updated_at);

  return (
    <tr
      className={isSelected ? 'selected' : ''}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <td>
        <span className={`type-tag ${source.source_type}`}>{typeLabel}</span>
      </td>
      <td className="name">{source.name}</td>
      <td>
        <StatusPill status={source.status} />
      </td>
      <td className={`num${source.status !== 'ready' ? ' faint' : ''}`}>
        {source.status === 'ready' ? source.chunk_count : '—'}
      </td>
      <td className="mono faint">{updatedDate}</td>
      <td>
        <span className="actions">
          <button
            className="row-icon-btn edit-btn"
            title="編集"
            onClick={e => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <IconPencil size={12} />
          </button>
          <button
            className="row-icon-btn danger"
            title="削除"
            disabled={isDeleting}
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
          >
            {isDeleting ? <IconX size={12} /> : <IconTrash size={12} />}
          </button>
        </span>
      </td>
    </tr>
  );
}

// ── StatusPill ───────────────────────────────────────────────────

function StatusPill({ status }: { status: SourceListItem['status'] }) {
  const map: Record<SourceListItem['status'], { cls: string; label: string }> = {
    pending:    { cls: 'pill pill-processing', label: '取り込み中' },
    processing: { cls: 'pill pill-processing', label: '取り込み中' },
    ready:      { cls: 'pill pill-ready',      label: '取り込み済み' },
    failed:     { cls: 'pill pill-failed',     label: '失敗' },
  };
  const { cls, label } = map[status];
  return <span className={cls}>{label}</span>;
}

// ── SourceDetailPane ─────────────────────────────────────────────

interface SourceDetailPaneProps {
  token: string;
  source: SourceListItem;
}

function SourceDetailPane({ token, source }: SourceDetailPaneProps) {
  const [chunks, setChunks] = useState<DocumentChunkItem[]>([]);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [totalChunks, setTotalChunks] = useState(source.chunk_count);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function loadDetail() {
      try {
        // まずドキュメント一覧を取得（最大 10 件）
        const docsResponse = await listDocuments(token, source.source_id, adminApiBase, { limit: 10 });
        if (cancelled) return;
        setDocuments(docsResponse.documents);

        // 最初のドキュメントのチャンクを最大 3 件取得
        const firstDoc = docsResponse.documents[0];
        if (firstDoc !== undefined) {
          const chunkResponse = await listDocumentChunks(token, firstDoc.document_id, adminApiBase);
          if (!cancelled) {
            setChunks(chunkResponse.chunks.slice(0, 3));
            // チャンク総数を全ドキュメントの合計から計算
            const total = docsResponse.documents.reduce((sum, d) => sum + d.chunk_count, 0);
            setTotalChunks(total > 0 ? total : source.chunk_count);
          }
        }
      } catch {
        // detail 取得失敗は無視
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadDetail();
    return () => { cancelled = true; };
  }, [token, source.source_id, source.chunk_count]);

  const typeLabel = source.source_type === 'text' ? 'txt' : source.source_type;
  const acquiredAt = formatDateTime(source.created_at);

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="title">
          {source.name}
          <span className="en">{source.chunk_count} chunks</span>
        </div>
      </div>
      <div style={{ padding: '12px 16px 4px' }}>
        <div className="meta-grid" style={{ marginBottom: 12 }}>
          <span className="k">type</span>
          <span className="v mono" style={{ fontSize: 11.5 }}>{typeLabel}</span>
          <span className="k">id</span>
          <span className="v mono" style={{ fontSize: 11.5 }}>{source.source_id}</span>
          <span className="k">chunks</span>
          <span className="v mono" style={{ fontSize: 11.5 }}>{source.chunk_count}</span>
          <span className="k">documents</span>
          <span className="v mono" style={{ fontSize: 11.5 }}>{source.document_count}</span>
          <span className="k">acquired</span>
          <span className="v mono" style={{ fontSize: 11.5 }}>{acquiredAt}</span>
          <span className="k">embed model</span>
          <span className="v mono" style={{ fontSize: 11.5 }}>— (local)</span>
        </div>

        {isLoading ? (
          <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 12 }}>読み込み中…</p>
        ) : chunks.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 12 }}>
            {source.status === 'ready' ? 'チャンクがありません。' : 'まだチャンクが生成されていません。'}
          </p>
        ) : (
          <>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10.5,
              fontWeight: 600,
              color: 'var(--ink-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              chunks preview // {Math.min(3, chunks.length)} of {totalChunks}
            </div>

            {chunks.map((chunk, idx) => (
              <div key={chunk.chunk_id} className="chunk-card">
                <div className="chunk-head">
                  <span className="id">chunk-{String(idx + 1).padStart(3, '0')}</span>
                  <span className="meta">
                    {chunk.page_number != null ? `p.${chunk.page_number} · ` : ''}
                    {chunk.content.length} chars
                  </span>
                </div>
                <div className="chunk-text">
                  {chunk.content.length > 200
                    ? chunk.content.slice(0, 200) + '…'
                    : chunk.content}
                </div>
              </div>
            ))}

            {totalChunks > 3 && documents.length > 0 && (
              <div style={{ textAlign: 'center', margin: '8px 0 14px' }}>
                <span
                  role="button"
                  tabIndex={0}
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--primary)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  show all {totalChunks} →
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── UploadSection ────────────────────────────────────────────────

interface UploadSectionProps {
  token: string;
  onUploaded: () => void;
}

function UploadSection({ token, onUploaded }: UploadSectionProps) {
  const [mode, setMode] = useState<UploadMode>('file');
  const [name, setName] = useState('');
  const [textBody, setTextBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<PreviewCsvIngestionResponse | null>(null);
  const [pdfPreview, setPdfPreview] = useState<PreviewPdfIngestionResponse | null>(null);
  const [titleColumn, setTitleColumn] = useState('');
  const [contentColumns, setContentColumns] = useState<string[]>([]);
  const [metadataColumns, setMetadataColumns] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sourceType = file ? detectSourceType(file.name) : null;

  function switchMode(next: UploadMode) {
    setMode(next);
    setFile(null);
    setTextBody('');
    setSuccess(null);
    resetPreview();
  }

  function resetPreview() {
    setCsvPreview(null);
    setPdfPreview(null);
    setTitleColumn('');
    setContentColumns([]);
    setMetadataColumns([]);
    setError(null);
  }

  function handleFileChange(next: File | null) {
    setFile(next);
    resetPreview();
    setSuccess(null);
    if (next !== null && name.trim() === '') {
      setName(next.name.replace(/\.(csv|pdf|txt)$/i, ''));
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped !== undefined) handleFileChange(dropped);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'text') {
      await submitText();
    } else {
      await submitFile();
    }
  }

  async function submitText() {
    const trimmedName = name.trim();
    const trimmedText = textBody.trim();
    if (trimmedName === '') { setError('ソース名を入力してください。'); return; }
    if (trimmedText === '') { setError('テキストを入力してください。'); return; }

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(30);

    try {
      const result = await createSource(token, { source_type: 'text', name: trimmedName, text: trimmedText }, adminApiBase);
      setUploadProgress(100);
      setSuccess(`「${result.name}」を取り込みました（${result.chunk_count} チャンク）。`);
      setName('');
      setTextBody('');
      onUploaded();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : '取り込みに失敗しました。');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  async function submitFile() {
    if (file === null || sourceType === null) {
      setError('CSV または PDF ファイルを選択してください。');
      return;
    }
    const trimmedName = name.trim();
    if (trimmedName === '') { setError('ソース名を入力してください。'); return; }

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(20);

    try {
      const content = await readFileAsBase64(file);
      setUploadProgress(50);

      const payload =
        sourceType === 'csv'
          ? {
              source_type: 'csv' as const,
              name: trimmedName,
              filename: file.name,
              content,
              column_mapping: buildColumnMapping(titleColumn, contentColumns, metadataColumns),
            }
          : {
              source_type: 'pdf' as const,
              name: trimmedName,
              filename: file.name,
              content,
            };

      const result = await createSource(token, payload, adminApiBase);
      setUploadProgress(100);
      setSuccess(`「${result.name}」を取り込みました（${result.chunk_count} チャンク）。`);
      setFile(null);
      setName('');
      resetPreview();
      onUploaded();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : '取り込みに失敗しました。');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  async function handlePreviewCsv() {
    if (file === null || sourceType !== 'csv') return;
    setIsUploading(true);
    setError(null);
    try {
      const content = await readFileAsBase64(file);
      const preview = await previewCsvIngestion(token, file.name, content, adminApiBase);
      setCsvPreview(preview);
      setPdfPreview(null);
      setTitleColumn(preview.headers[0] ?? '');
      setContentColumns(preview.headers.length > 1 ? preview.headers.slice(1) : preview.headers);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'プレビューに失敗しました。');
    } finally {
      setIsUploading(false);
    }
  }

  async function handlePreviewPdf() {
    if (file === null || sourceType !== 'pdf') return;
    setIsUploading(true);
    setError(null);
    try {
      const content = await readFileAsBase64(file);
      const preview = await previewPdfIngestion(token, file.name, content, adminApiBase);
      setPdfPreview(preview);
      setCsvPreview(null);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'プレビューに失敗しました。');
    } finally {
      setIsUploading(false);
    }
  }

  function toggleColumn(column: string, selected: string[], setter: (v: string[]) => void) {
    if (selected.includes(column)) setter(selected.filter(c => c !== column));
    else setter([...selected, column]);
  }

  // CSV 列マッピング: プレビューなしで contentColumns が空の場合は自動設定
  const canSubmitFile =
    file !== null &&
    sourceType !== null &&
    name.trim() !== '' &&
    (sourceType === 'pdf' || csvPreview === null || contentColumns.length > 0);

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      {/* Segmented switch */}
      <div className="seg-input">
        <button
          type="button"
          className={mode === 'file' ? 'on' : ''}
          onClick={() => switchMode('file')}
        >
          <IconUpload size={13} />
          ファイルをアップロード
        </button>
        <button
          type="button"
          className={mode === 'text' ? 'on' : ''}
          onClick={() => switchMode('text')}
        >
          <IconFile size={13} />
          テキストを貼り付け
        </button>
      </div>

      {/* ソース名フィールド */}
      <div className="field">
        <label className="field-label">
          ソース名
          <span className="en">name</span>
          <span className="req">*</span>
        </label>
        <input
          className="field-input"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例: 商品カタログ 2026 春"
        />
        <div className="field-hint">この名前で会話ログの引用元として表示されます。</div>
      </div>

      {/* ファイル mode */}
      {mode === 'file' && (
        <>
          <div className="field">
            <label className="field-label">
              ファイル
              <span className="en">file</span>
              <span className="req">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf,.txt,text/csv,application/pdf,text/plain"
              style={{ display: 'none' }}
              onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
            />
            {file === null ? (
              <div
                className="dropzone"
                style={isDragging ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)' } : {}}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              >
                <div className="dz-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div className="dz-title">クリックしてファイルを選択</div>
                <div>もしくはここにドラッグ&amp;ドロップ</div>
                <div className="dz-hint">CSV / PDF / TXT · 最大 20 MB</div>
              </div>
            ) : (
              <div
                className="dropzone"
                style={{ cursor: 'default', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 6,
                  background: 'var(--primary-soft)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <IconFile size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink-strong)', fontSize: 13 }}>{file.name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, color: 'var(--ink-faint)' }}>
                    {formatFileSize(file.size)}
                    {sourceType === null ? ' · サポートされていない形式' : ''}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={e => { e.stopPropagation(); handleFileChange(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                >
                  削除
                </button>
              </div>
            )}
          </div>

          {/* サポートされていないファイル */}
          {file !== null && sourceType === null && (
            <p style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 10 }}>
              CSV または PDF ファイルを選択してください。
            </p>
          )}

          {/* プレビューボタン（CSV/PDF、プレビュー前） */}
          {file !== null && sourceType !== null && csvPreview === null && pdfPreview === null && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: 10 }}
              disabled={isUploading}
              onClick={() => void (sourceType === 'csv' ? handlePreviewCsv() : handlePreviewPdf())}
            >
              {isUploading ? 'プレビュー中…' : 'プレビュー'}
            </button>
          )}

          {/* CSV プレビュー: 列マッピング */}
          {csvPreview !== null && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--hair)',
              borderRadius: 6,
              padding: '12px 14px',
              marginBottom: 12,
            }}>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, color: 'var(--ink-muted)', marginBottom: 8 }}>
                {csvPreview.row_count} 行 · 区切り文字: {csvPreview.detected_delimiter === '\t' ? 'TAB' : `"${csvPreview.detected_delimiter}"`}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {/* タイトル列 */}
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="field-label" style={{ fontSize: 11.5 }}>
                    タイトル列 <span className="en" style={{ fontSize: 10 }}>title column</span>
                  </label>
                  <select
                    className="field-select"
                    value={titleColumn}
                    onChange={e => setTitleColumn(e.target.value)}
                    style={{ height: 28, fontSize: 12 }}
                  >
                    {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                {/* コンテンツ列 */}
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="field-label" style={{ fontSize: 11.5 }}>
                    コンテンツ列 <span className="en" style={{ fontSize: 10 }}>content</span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {csvPreview.headers.map(h => (
                      <label key={h} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <input
                          type="checkbox"
                          checked={contentColumns.includes(h)}
                          onChange={() => toggleColumn(h, contentColumns, setContentColumns)}
                        />
                        {h}
                      </label>
                    ))}
                  </div>
                </div>
                {/* メタデータ列 */}
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="field-label" style={{ fontSize: 11.5 }}>
                    メタデータ列 <span className="en" style={{ fontSize: 10 }}>metadata</span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {csvPreview.headers.map(h => (
                      <label key={h} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <input
                          type="checkbox"
                          checked={metadataColumns.includes(h)}
                          onChange={() => toggleColumn(h, metadataColumns, setMetadataColumns)}
                        />
                        {h}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {/* サンプル行プレビュー */}
              {csvPreview.sample_rows.length > 0 && (
                <div style={{ marginTop: 10, overflowX: 'auto' }}>
                  <table style={{ fontSize: 11, width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {csvPreview.headers.map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '4px 8px', background: 'var(--bg-soft)', color: 'var(--ink-muted)', fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.sample_rows.slice(0, 3).map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} style={{ padding: '3px 8px', borderBottom: '1px solid var(--hair-soft)', color: 'var(--ink)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PDF プレビュー */}
          {pdfPreview !== null && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--hair)',
              borderRadius: 6,
              padding: '12px 14px',
              marginBottom: 12,
            }}>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, color: 'var(--ink-muted)', marginBottom: 8 }}>
                {pdfPreview.page_count} ページ
              </div>
              <pre style={{
                maxHeight: 120, overflow: 'auto',
                background: 'var(--bg-soft)', borderRadius: 4,
                padding: '8px 10px',
                fontSize: 11.5, color: 'var(--ink-muted)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                {pdfPreview.sample_text.slice(0, 600)}
                {pdfPreview.sample_text.length > 600 ? '…' : ''}
              </pre>
            </div>
          )}
        </>
      )}

      {/* テキスト mode */}
      {mode === 'text' && (
        <div className="field">
          <label className="field-label">
            テキスト
            <span className="en">text</span>
            <span className="req">*</span>
          </label>
          <textarea
            className="field-textarea"
            value={textBody}
            onChange={e => setTextBody(e.target.value)}
            placeholder="テキストをここに貼り付けてください…"
            style={{ minHeight: 120 }}
          />
        </div>
      )}

      {/* アップロード進行中ストリップ */}
      {isUploading && uploadProgress > 0 && (
        <div className="upload-strip" style={{ marginTop: 4 }}>
          <div className="ic">
            <IconFile size={14} />
          </div>
          <div className="body">
            <div className="name">{(file?.name ?? name) || 'テキスト'}</div>
            <div className="meta">取り込み中…</div>
            <div className="prog">
              <div className="fill" style={{ width: `${uploadProgress}%`, transition: 'width 200ms ease' }}></div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsUploading(false)}>
            中止
          </button>
        </div>
      )}

      {/* エラー・成功メッセージ */}
      {error !== null && (
        <p style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 8 }}>{error}</p>
      )}
      {success !== null && (
        <p style={{ color: 'var(--success)', fontSize: 12.5, marginBottom: 8 }}>{success}</p>
      )}

      {/* アクションボタン */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isUploading || (mode === 'file' && !canSubmitFile)}
        >
          {isUploading ? '取り込み中…' : '取り込み開始'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setName('');
            setTextBody('');
            setFile(null);
            setSuccess(null);
            resetPreview();
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

// ── ユーティリティ ─────────────────────────────────────────────────

function buildColumnMapping(
  titleColumn: string,
  contentColumns: string[],
  metadataColumns: string[],
): CsvColumnMapping {
  const mapping: CsvColumnMapping = {
    title_column: titleColumn,
    content_columns: contentColumns,
  };
  if (metadataColumns.length > 0) {
    mapping.metadata_columns = metadataColumns;
  }
  return mapping;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mn = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${mn}`;
  } catch {
    return isoStr;
  }
}

function formatDateTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toISOString().replace('T', ' ').slice(0, 19) + ' JST';
  } catch {
    return isoStr;
  }
}
