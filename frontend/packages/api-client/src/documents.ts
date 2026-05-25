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
): Promise<ListDocumentsResponse> {
  return fetchJson<ListDocumentsResponse>(`${apiBase}/admin/sources/${sourceId}/documents`, {
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
  const response = await fetch(`${apiBase}/admin/documents/${documentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} for /admin/documents/${documentId}: ${text.slice(0, 160)}`);
  }
}
