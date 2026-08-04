import { useId, useRef, useState } from 'react';
import { Msg, useMsg } from '@/shared/i18n';

const ACCEPT = '.csv,.pdf,text/csv,application/pdf';

export interface FileUploadFieldProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function FileUploadField({ file, onFileChange }: FileUploadFieldProps) {
  const t = useMsg();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openPicker(): void {
    inputRef.current?.click();
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    onFileChange(event.target.files?.[0] ?? null);
  }

  function handleRemove(): void {
    onFileChange(null);
    if (inputRef.current !== null) {
      inputRef.current.value = '';
    }
  }

  function pickFromDataTransfer(dataTransfer: DataTransfer | null): void {
    if (dataTransfer === null || dataTransfer.files.length === 0) {
      return;
    }

    onFileChange(dataTransfer.files[0] ?? null);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
    pickFromDataTransfer(event.dataTransfer);
  }

  return (
    <div className="mt-1">
      <input
        ref={inputRef}
        id={inputId}
        className="sr-only"
        type="file"
        accept={ACCEPT}
        onChange={handleInputChange}
      />

      {file === null ? (
        <div
          role="button"
          tabIndex={0}
          className={`nc-file-dropzone ${isDragging ? 'nc-file-dropzone-active' : ''}`}
          onClick={openPicker}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openPicker();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span className="nc-file-dropzone-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 16V4m0 0 7 7m-7-7L5 11" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 20h16" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-medium text-fg">{t(Msg.admin.ingestion.fileChoose)}</span>
          <span className="nc-text-muted">{t(Msg.admin.ingestion.fileDrop)}</span>
          <span className="nc-text-subtle">{t(Msg.admin.ingestion.fileFormats)}</span>
        </div>
      ) : (
        <div className="nc-file-selected">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{file.name}</p>
            <p className="nc-text-subtle">{formatFileSize(file.size)}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button className="nc-btn nc-header-btn" type="button" onClick={openPicker}>
              {t(Msg.admin.ingestion.fileChange)}
            </button>
            <button className="nc-btn nc-header-btn" type="button" onClick={handleRemove}>
              {t(Msg.admin.ingestion.fileRemove)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
