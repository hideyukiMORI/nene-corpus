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

export interface LoginAdminResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
}

export interface AdminMeResponse {
  id: number;
  email: string;
  role: string;
}

export interface SourceListItem {
  source_id: number;
  name: string;
  source_type: 'csv' | 'pdf' | 'text';
  status: 'pending' | 'processing' | 'ready' | 'failed';
  document_count: number;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface ListSourcesResponse {
  sources: SourceListItem[];
}

export interface PreviewCsvIngestionResponse {
  headers: string[];
  sample_rows: string[][];
  detected_delimiter: string;
  row_count: number;
}

export interface PreviewPdfIngestionResponse {
  page_count: number;
  sample_text: string;
}

export interface CsvColumnMapping {
  title_column: string;
  content_columns: string[];
  metadata_columns?: string[];
}

export interface CreateSourceResponse {
  source_id: number;
  name: string;
  status: SourceListItem['status'];
  document_count: number;
  chunk_count: number;
}

export interface ChatSessionSummary {
  session_id: number;
  message_count: number;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface ListChatSessionsResponse {
  sessions: ChatSessionSummary[];
}

export interface ChatMessageListItem {
  message_id: number;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface ListChatSessionMessagesResponse {
  session_id: number;
  messages: ChatMessageListItem[];
}

export interface WidgetTheme {
  color_primary: string;
  color_surface: string;
  color_text: string;
  radius_md: string;
  max_width: string;
}

export interface WidgetHero {
  title: string | null;
  description: string | null;
  cta_label: string | null;
  show_title: boolean;
  show_description: boolean;
  show_cta: boolean;
}

export const DEFAULT_WIDGET_HERO: WidgetHero = {
  title: null,
  description: null,
  cta_label: null,
  show_title: true,
  show_description: true,
  show_cta: true,
};

export interface AppearanceSettingsResponse {
  widget_locale: 'en' | 'ja' | 'fr' | 'zh-Hans' | 'pt-BR' | 'de' | null;
  theme: WidgetTheme;
  hero: WidgetHero;
}

export type UpdateAppearanceSettingsRequest = AppearanceSettingsResponse;
