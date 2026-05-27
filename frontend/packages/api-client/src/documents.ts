import { fetchJson } from './fetch-json';
import type {
  DocumentDetailResponse,
  ListDocumentChunksResponse,
  ListDocumentsResponse,
  UpdateDocumentRequest,
} from './types';

export async function listDocuments(
  token: string,
  sourceId: number,
  apiBase = '',
  options: { limit?: number; offset?: number; q?: string } = {},
): Promise<ListDocumentsResponse> {
  const params = new URLSearchParams();

  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }

  if (options.offset !== undefined && options.offset > 0) {
    params.set('offset', String(options.offset));
  }

  if (options.q !== undefined && options.q.trim() !== '') {
    params.set('q', options.q.trim());
  }

  const qs = params.toString();
  const url = `${apiBase}/admin/sources/${sourceId}/documents${qs ? `?${qs}` : ''}`;

  return fetchJson<ListDocumentsResponse>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getDocument(
  token: string,
  documentId: number,
  apiBase = '',
): Promise<DocumentDetailResponse> {
  return fetchJson<DocumentDetailResponse>(`${apiBase}/admin/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listDocumentChunks(
  token: string,
  documentId: number,
  apiBase = '',
): Promise<ListDocumentChunksResponse> {
  return fetchJson<ListDocumentChunksResponse>(`${apiBase}/admin/documents/${documentId}/chunks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateDocument(
  token: string,
  documentId: number,
  body: UpdateDocumentRequest,
  apiBase = '',
): Promise<DocumentDetailResponse> {
  return fetchJson<DocumentDetailResponse>(`${apiBase}/admin/documents/${documentId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function deleteDocument(
  token: string,
  documentId: number,
  apiBase = '',
): Promise<void> {
  await fetchJson<unknown>(`${apiBase}/admin/documents/${documentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
