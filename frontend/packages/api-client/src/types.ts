/** OpenAPI-aligned response shapes — keep snake_case field names. */

export interface HealthResponse {
  status: string;
  service: string;
}

export interface CreateChatSessionResponse {
  session_id: number;
  session_token: string;
}

export interface Citation {
  chunk_id: number;
  document_id: number;
  source_id: number;
  excerpt: string;
  page_number?: number;
  section_label?: string;
}

export interface SendChatMessageResponse {
  message_id: number;
  session_id: number;
  role: 'assistant';
  content: string;
  citations: Citation[];
}
