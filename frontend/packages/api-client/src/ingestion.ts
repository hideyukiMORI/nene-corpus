import { createAdminTransport } from './transport';
import type {
  CreateSourceResponse,
  CsvColumnMapping,
  PreviewCsvIngestionResponse,
  PreviewPdfIngestionResponse,
} from './types';

export async function previewCsvIngestion(
  token: string,
  filename: string,
  content: string,
  apiBase = '',
): Promise<PreviewCsvIngestionResponse> {
  return createAdminTransport(token, apiBase).post<PreviewCsvIngestionResponse>(
    '/admin/ingestion/csv/preview',
    { filename, content },
  );
}

export async function previewPdfIngestion(
  token: string,
  filename: string,
  content: string,
  apiBase = '',
): Promise<PreviewPdfIngestionResponse> {
  return createAdminTransport(token, apiBase).post<PreviewPdfIngestionResponse>(
    '/admin/ingestion/pdf/preview',
    { filename, content },
  );
}

export type CreateSourcePayload =
  | {
      source_type: 'csv';
      name: string;
      filename: string;
      content: string;
      column_mapping: CsvColumnMapping;
    }
  | {
      source_type: 'pdf';
      name: string;
      filename: string;
      content: string;
    }
  | {
      source_type: 'text';
      name: string;
      text: string;
    };

export async function createSource(
  token: string,
  payload: CreateSourcePayload,
  apiBase = '',
): Promise<CreateSourceResponse> {
  return createAdminTransport(token, apiBase).post<CreateSourceResponse>(
    '/admin/sources',
    payload,
  );
}
