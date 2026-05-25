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
import { detectSourceType, readFileAsBase64 } from './fileBase64';

interface IngestionPanelProps {
  token: string;
  onUploaded: () => void;
}

export function IngestionPanel({ token, onUploaded }: IngestionPanelProps) {
  const t = useMsg();
  const [name, setName] = useState('');
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

  function resetPreview(): void {
    setCsvPreview(null);
    setPdfPreview(null);
    setTitleColumn('');
    setContentColumns([]);
    setMetadataColumns([]);
    setError(null);
    setSuccess(null);
  }

  function handleFileChange(next: File | null): void {
    setFile(next);
    resetPreview();

    if (next !== null && name.trim() === '') {
      setName(next.name.replace(/\.(csv|pdf)$/i, ''));
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
        const preview = await previewCsvIngestion(token, file.name, content);
        setCsvPreview(preview);
        setPdfPreview(null);
        setTitleColumn(preview.headers[0] ?? '');
        setContentColumns(preview.headers.length > 1 ? preview.headers.slice(1) : preview.headers);
      } else {
        const preview = await previewPdfIngestion(token, file.name, content);
        setPdfPreview(preview);
        setCsvPreview(null);
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.ingestion.previewFailed));
    } finally {
      setIsPreviewing(false);
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

      const result = await createSource(token, payload);
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
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-medium">{t(Msg.admin.ingestion.title)}</h2>
        <p className="text-sm text-slate-600">{t(Msg.admin.ingestion.subtitle)}</p>
      </div>
      <form className="space-y-4 px-4 py-4" onSubmit={(event) => void handlePreview(event)}>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">{t(Msg.admin.ingestion.sourceName)}</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t(Msg.admin.ingestion.sourceNamePlaceholder)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">{t(Msg.admin.ingestion.file)}</span>
          <input
            className="mt-1 block w-full text-sm text-slate-600"
            type="file"
            accept=".csv,.pdf,text/csv,application/pdf"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
          />
        </label>
        {sourceType === null && file !== null && (
          <p className="text-sm text-red-600">{t(Msg.admin.ingestion.unsupportedFile)}</p>
        )}
        {file !== null && sourceType !== null && csvPreview === null && pdfPreview === null && (
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            type="submit"
            disabled={isPreviewing}
          >
            {isPreviewing ? t(Msg.admin.ingestion.previewing) : t(Msg.admin.ingestion.previewFile)}
          </button>
        )}
      </form>

      {csvPreview !== null && (
        <div className="space-y-4 border-t border-slate-200 px-4 py-4">
          <p className="text-sm text-slate-600">
            {t(Msg.admin.ingestion.csvSummary, {
              count: csvPreview.row_count,
              delimiter: csvPreview.detected_delimiter,
            })}
          </p>
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

      {pdfPreview !== null && (
        <div className="space-y-3 border-t border-slate-200 px-4 py-4">
          <p className="text-sm text-slate-600">
            {t(Msg.admin.ingestion.pdfPageCount, { count: pdfPreview.page_count })}
          </p>
          <pre className="max-h-40 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-700 whitespace-pre-wrap">
            {pdfPreview.sample_text.slice(0, 800)}
            {pdfPreview.sample_text.length > 800 ? '…' : ''}
          </pre>
        </div>
      )}

      {(csvPreview !== null || pdfPreview !== null) && (
        <div className="border-t border-slate-200 px-4 py-4">
          <button
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
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
        <span className="font-medium text-slate-700">{t(Msg.admin.ingestion.titleColumn)}</span>
        <select
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
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
        <legend className="font-medium text-slate-700">{t(Msg.admin.ingestion.contentColumns)}</legend>
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
        <legend className="font-medium text-slate-700">{t(Msg.admin.ingestion.metadataColumns)}</legend>
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
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 text-left text-slate-600">
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
            <tr key={index} className="border-t border-slate-100">
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
