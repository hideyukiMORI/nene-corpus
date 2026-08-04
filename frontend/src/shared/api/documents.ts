import { createAdminTransport } from './transport';
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
  const path = `/admin/sources/${sourceId}/documents${qs ? `?${qs}` : ''}`;

  return createAdminTransport(token, apiBase).get<ListDocumentsResponse>(path);
}

export async function getDocument(
  token: string,
  documentId: number,
  apiBase = '',
): Promise<DocumentDetailResponse> {
  return createAdminTransport(token, apiBase).get<DocumentDetailResponse>(
    `/admin/documents/${documentId}`,
  );
}

export async function listDocumentChunks(
  token: string,
  documentId: number,
  apiBase = '',
): Promise<ListDocumentChunksResponse> {
  return createAdminTransport(token, apiBase).get<ListDocumentChunksResponse>(
    `/admin/documents/${documentId}/chunks`,
  );
}

export async function updateDocument(
  token: string,
  documentId: number,
  body: UpdateDocumentRequest,
  apiBase = '',
): Promise<DocumentDetailResponse> {
  return createAdminTransport(token, apiBase).put<DocumentDetailResponse>(
    `/admin/documents/${documentId}`,
    body,
  );
}

export async function deleteDocument(
  token: string,
  documentId: number,
  apiBase = '',
): Promise<void> {
  await createAdminTransport(token, apiBase).delete<void>(`/admin/documents/${documentId}`);
}
