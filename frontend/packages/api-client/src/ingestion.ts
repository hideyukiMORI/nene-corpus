import { fetchJson } from './fetch-json';
import type {
  CreateSourceResponse,
  CsvColumnMapping,
  PreviewCsvIngestionResponse,
  PreviewPdfIngestionResponse,
} from './types';

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function previewCsvIngestion(
  token: string,
  filename: string,
  content: string,
  apiBase = '',
): Promise<PreviewCsvIngestionResponse> {
  return fetchJson<PreviewCsvIngestionResponse>(`${apiBase}/admin/ingestion/csv/preview`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ filename, content }),
  });
}

export async function previewPdfIngestion(
  token: string,
  filename: string,
  content: string,
  apiBase = '',
): Promise<PreviewPdfIngestionResponse> {
  return fetchJson<PreviewPdfIngestionResponse>(`${apiBase}/admin/ingestion/pdf/preview`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ filename, content }),
  });
}

export interface CreateSourcePayload {
  source_type: 'csv' | 'pdf';
  name: string;
  filename: string;
  content: string;
  column_mapping?: CsvColumnMapping;
}

export async function createSource(
  token: string,
  payload: CreateSourcePayload,
  apiBase = '',
): Promise<CreateSourceResponse> {
  return fetchJson<CreateSourceResponse>(`${apiBase}/admin/sources`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}
