import { FormEvent, useState } from 'react';
import {
  createSource,
  previewCsvIngestion,
  previewPdfIngestion,
  type CsvColumnMapping,
  type PreviewCsvIngestionResponse,
  type PreviewPdfIngestionResponse,
} from '@nene-corpus/api-client';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { adminApiBase } from './config';
import { HelpLabel } from './HelpLabel';
import { ColumnMappingGuide } from './ColumnMappingGuide';
import { FileUploadField } from './FileUploadField';
import { detectSourceType, readFileAsBase64 } from './fileBase64';

type IngestionMode = 'file' | 'text';

interface IngestionPanelProps {
  token: string;
  onUploaded: () => void;
}

export function IngestionPanel({ token, onUploaded }: IngestionPanelProps) {
  const t = useMsg();
  const [mode, setMode] = useState<IngestionMode>('file');
  const [name, setName] = useState('');
  const [textBody, setTextBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<PreviewCsvIngestionResponse | null>(null);
  const [pdfPreview, setPdfPreview] = useState<PreviewPdfIngestionResponse | null>(null);
  const [titleColumn, setTitleColumn] = useState('');
  const [contentColumns, setContentColumns] = useState<string[]>([]);
  const [metadataColumns, setMetadataColumns] = useState<string[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sourceType = file ? detectSourceType(file.name) : null;

  function switchMode(next: IngestionMode): void {
    setMode(next);
    setFile(null);
    setTextBody('');
    setSuccess(null);
    resetPreview();
  }

  function resetPreview(): void {
    setCsvPreview(null);
    setPdfPreview(null);
    setTitleColumn('');
    setContentColumns([]);
    setMetadataColumns([]);
    setError(null);
    // NOTE: success is intentionally NOT cleared here.
    // Callers that want to clear it (mode switch, new file selection) do so explicitly.
    // This prevents React 18 batching from erasing the success message when
    // handleIngest calls handleFileChange(null) immediately after setSuccess().
  }

  function handleFileChange(next: File | null): void {
    setFile(next);
    resetPreview();

    if (next !== null) {
      // New file selected — clear any previous success/error and auto-fill name
      setSuccess(null);
      if (name.trim() === '') {
        setName(next.name.replace(/\.(csv|pdf)$/i, ''));
      }
    }
  }

  async function handlePreview(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (file === null || sourceType === null) {
      setError(t(Msg.admin.ingestion.chooseFile));
      return;
    }

    setIsPreviewing(true);
    setError(null);
    setSuccess(null);

    try {
      const content = await readFileAsBase64(file);

      if (sourceType === 'csv') {
        const preview = await previewCsvIngestion(token, file.name, content, adminApiBase);
        setCsvPreview(preview);
        setPdfPreview(null);
        setTitleColumn(preview.headers[0] ?? '');
        setContentColumns(preview.headers.length > 1 ? preview.headers.slice(1) : preview.headers);
      } else {
        const preview = await previewPdfIngestion(token, file.name, content, adminApiBase);
        setPdfPreview(preview);
        setCsvPreview(null);
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.ingestion.previewFailed));
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleTextIngest(): Promise<void> {
    const trimmedName = name.trim();
    const trimmedText = textBody.trim();

    if (trimmedName === '') {
      setError(t(Msg.admin.ingestion.sourceNameRequired));
      return;
    }

    if (trimmedText === '') {
      setError(t(Msg.admin.ingestion.textRequired));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createSource(
        token,
        {
          source_type: 'text',
          name: trimmedName,
          text: trimmedText,
        },
        adminApiBase,
      );
      setSuccess(
        t(Msg.admin.ingestion.ingestResult, {
          name: result.name,
          documentCount: result.document_count,
          chunkCount: result.chunk_count,
        }),
      );
      setName('');
      setTextBody('');
      onUploaded();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.ingestion.ingestionFailed));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleIngest(): Promise<void> {
    if (file === null || sourceType === null) {
      return;
    }

    const trimmedName = name.trim();

    if (trimmedName === '') {
      setError(t(Msg.admin.ingestion.sourceNameRequired));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const content = await readFileAsBase64(file);
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
      setSuccess(
        t(Msg.admin.ingestion.ingestResult, {
          name: result.name,
          documentCount: result.document_count,
          chunkCount: result.chunk_count,
        }),
      );
      handleFileChange(null);
      setName('');
      onUploaded();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.ingestion.ingestionFailed));
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleColumn(column: string, selected: string[], setter: (value: string[]) => void): void {
    if (selected.includes(column)) {
      setter(selected.filter((item) => item !== column));
      return;
    }

    setter([...selected, column]);
  }

  return (
    <section className="nc-panel">
      <div className="nc-panel-head">
        <h2 className="font-medium">{t(Msg.admin.ingestion.title)}</h2>
        <p>{t(Msg.admin.ingestion.subtitle)}</p>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
        <button
          className={mode === 'file' ? 'nc-btn-primary' : 'nc-btn'}
          type="button"
          onClick={() => switchMode('file')}
        >
          {t(Msg.admin.ingestion.modeFile)}
        </button>
        <button
          className={mode === 'text' ? 'nc-btn-primary' : 'nc-btn'}
          type="button"
          onClick={() => switchMode('text')}
        >
          {t(Msg.admin.ingestion.modeText)}
        </button>
      </div>
      {mode === 'file' ? (
      <form className="space-y-4 px-4 py-4" onSubmit={(event) => void handlePreview(event)}>
        <label className="block text-sm">
          <HelpLabel
            className="font-medium text-fg"
            label={t(Msg.admin.ingestion.sourceName)}
            help={t(Msg.admin.ingestion.sourceNameHelp)}
          />
          <input
            className="nc-input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t(Msg.admin.ingestion.sourceNamePlaceholder)}
          />
        </label>
        <div className="block text-sm">
          <HelpLabel
            className="font-medium text-fg"
            label={t(Msg.admin.ingestion.file)}
            help={t(Msg.admin.ingestion.fileHelp)}
          />
          <FileUploadField file={file} onFileChange={handleFileChange} />
        </div>
        {sourceType === null && file !== null && (
          <p className="text-sm text-red-600">{t(Msg.admin.ingestion.unsupportedFile)}</p>
        )}
        {file !== null && sourceType !== null && csvPreview === null && pdfPreview === null && (
          <button className="nc-btn-primary" type="submit" disabled={isPreviewing}>
            {isPreviewing ? t(Msg.admin.ingestion.previewing) : t(Msg.admin.ingestion.previewFile)}
          </button>
        )}
      </form>
      ) : (
        <div className="space-y-4 px-4 py-4">
          <label className="block text-sm">
            <HelpLabel
              className="font-medium text-fg"
              label={t(Msg.admin.ingestion.sourceName)}
              help={t(Msg.admin.ingestion.sourceNameHelp)}
            />
            <input
              className="nc-input"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t(Msg.admin.ingestion.sourceNamePlaceholder)}
            />
          </label>
          <label className="block text-sm">
            <HelpLabel
              className="font-medium text-fg"
              label={t(Msg.admin.ingestion.textBody)}
              help={t(Msg.admin.ingestion.textBodyHelp)}
            />
            <textarea
              className="nc-input min-h-40 resize-y"
              value={textBody}
              onChange={(event) => setTextBody(event.target.value)}
              placeholder={t(Msg.admin.ingestion.textBodyPlaceholder)}
            />
          </label>
          <button
            className="nc-btn-success"
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleTextIngest()}
          >
            {isSubmitting ? t(Msg.admin.ingestion.ingesting) : t(Msg.admin.ingestion.ingest)}
          </button>
        </div>
      )}

      {mode === 'file' && csvPreview !== null && (
        <div className="space-y-4 border-t border-border px-4 py-4">
          <p className="nc-text-muted">
            {t(Msg.admin.ingestion.csvSummary, {
              count: csvPreview.row_count,
              delimiter: csvPreview.detected_delimiter,
            })}
          </p>
          <ColumnMappingGuide />
          <ColumnMappingEditor
            headers={csvPreview.headers}
            titleColumn={titleColumn}
            contentColumns={contentColumns}
            metadataColumns={metadataColumns}
            onTitleColumnChange={setTitleColumn}
            onToggleContent={(column) => toggleColumn(column, contentColumns, setContentColumns)}
            onToggleMetadata={(column) => toggleColumn(column, metadataColumns, setMetadataColumns)}
          />
          <PreviewTable headers={csvPreview.headers} rows={csvPreview.sample_rows} />
        </div>
      )}

      {mode === 'file' && pdfPreview !== null && (
        <div className="space-y-3 border-t border-border px-4 py-4">
          <p className="nc-text-muted">
            {t(Msg.admin.ingestion.pdfPageCount, { count: pdfPreview.page_count })}
          </p>
          <pre className="max-h-40 overflow-auto rounded-admin bg-surface-muted p-3 nc-text-muted whitespace-pre-wrap break-words">
            {pdfPreview.sample_text.slice(0, 800)}
            {pdfPreview.sample_text.length > 800 ? '…' : ''}
          </pre>
        </div>
      )}

      {mode === 'file' && (csvPreview !== null || pdfPreview !== null) && (
        <div className="border-t border-border px-4 py-4">
          <button
            className="nc-btn-success"
            type="button"
            disabled={isSubmitting || (sourceType === 'csv' && contentColumns.length === 0)}
            onClick={() => void handleIngest()}
          >
            {isSubmitting ? t(Msg.admin.ingestion.ingesting) : t(Msg.admin.ingestion.ingest)}
          </button>
        </div>
      )}

      {error !== null && <p className="px-4 pb-4 text-sm text-red-600">{error}</p>}
      {success !== null && <p className="px-4 pb-4 text-sm text-emerald-700">{success}</p>}
    </section>
  );
}

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

interface ColumnMappingEditorProps {
  headers: string[];
  titleColumn: string;
  contentColumns: string[];
  metadataColumns: string[];
  onTitleColumnChange: (value: string) => void;
  onToggleContent: (column: string) => void;
  onToggleMetadata: (column: string) => void;
}

function ColumnMappingEditor({
  headers,
  titleColumn,
  contentColumns,
  metadataColumns,
  onTitleColumnChange,
  onToggleContent,
  onToggleMetadata,
}: ColumnMappingEditorProps) {
  const t = useMsg();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <label className="block text-sm">
        <HelpLabel
          className="font-medium text-fg"
          label={t(Msg.admin.ingestion.titleColumn)}
          help={t(Msg.admin.ingestion.titleColumnHelp)}
        />
        <select
          className="nc-input"
          value={titleColumn}
          onChange={(event) => onTitleColumnChange(event.target.value)}
        >
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="text-sm">
        <legend className="font-medium text-fg">
          <HelpLabel
            label={t(Msg.admin.ingestion.contentColumns)}
            help={t(Msg.admin.ingestion.contentColumnsHelp)}
          />
        </legend>
        <div className="mt-2 space-y-1">
          {headers.map((header) => (
            <label key={header} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={contentColumns.includes(header)}
                onChange={() => onToggleContent(header)}
              />
              {header}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="text-sm">
        <legend className="font-medium text-fg">
          <HelpLabel
            label={t(Msg.admin.ingestion.metadataColumns)}
            help={t(Msg.admin.ingestion.metadataColumnsHelp)}
          />
        </legend>
        <div className="mt-2 space-y-1">
          {headers.map((header) => (
            <label key={header} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={metadataColumns.includes(header)}
                onChange={() => onToggleMetadata(header)}
              />
              {header}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

interface PreviewTableProps {
  headers: string[];
  rows: string[][];
}

function PreviewTable({ headers, rows }: PreviewTableProps) {
  return (
    <div className="overflow-x-auto rounded-admin border border-border">
      <table className="min-w-full text-xs">
        <thead className="nc-table-head">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="nc-table-row">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
