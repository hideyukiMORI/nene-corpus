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

export interface DocumentListItem {
  document_id: number;
  source_id: number;
  title: string;
  position: number;
  chunk_count: number;
  content_preview: string;
  created_at: string;
  updated_at: string;
}

export interface ListDocumentsResponse {
  documents: DocumentListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface DocumentDetailResponse {
  document_id: number;
  source_id: number;
  title: string;
  position: number;
  chunk_count: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateDocumentRequest {
  title: string;
  content: string;
}

export interface DocumentChunkItem {
  chunk_id: number;
  chunk_index: number;
  content: string;
  page_number?: number | null;
  section_label?: string | null;
  token_count?: number | null;
}

export interface ListDocumentChunksResponse {
  chunks: DocumentChunkItem[];
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
  client_ip: string | null;
  user_agent: string | null;
  referer: string | null;
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
  radius_panel: string;
  radius_control: string;
  max_width: string;
}

export interface WidgetHero {
  title: string | null;
  description: string | null;
  cta_label: string | null;
  show_title: boolean;
  show_description: boolean;
  show_cta: boolean;
  show_image: boolean;
  image_url: string | null;
  image_alt: string | null;
  gap_after: string;
  padding_bottom: string;
  show_divider: boolean;
}

export const DEFAULT_WIDGET_HERO: WidgetHero = {
  title: null,
  description: null,
  cta_label: null,
  show_title: true,
  show_description: true,
  show_cta: true,
  show_image: true,
  image_url: null,
  image_alt: null,
  gap_after: '1rem',
  padding_bottom: '1rem',
  show_divider: true,
};

export type UserAvatarMode = 'silhouette' | 'none';

export interface WidgetChat {
  user_avatar_mode: UserAvatarMode;
  show_assistant_avatar: boolean;
  assistant_avatar_url: string | null;
  assistant_avatar_alt: string | null;
}

export const DEFAULT_WIDGET_CHAT: WidgetChat = {
  user_avatar_mode: 'silhouette',
  show_assistant_avatar: true,
  assistant_avatar_url: null,
  assistant_avatar_alt: null,
};

export type WidgetPosition = 'inline' | 'bottom_right' | 'bottom_left' | 'top_right' | 'top_left';

export interface WidgetLayout {
  max_height: string;
  position: WidgetPosition;
  offset_x: number;
  offset_y: number;
  floating_launcher: boolean;
}

export const DEFAULT_WIDGET_LAYOUT: WidgetLayout = {
  max_height: '32rem',
  position: 'inline',
  offset_x: 16,
  offset_y: 16,
  floating_launcher: false,
};

export interface UploadHeroImageRequest {
  filename: string;
  content: string;
}

export interface UploadHeroImageResponse {
  image_url: string;
}

export type UploadAvatarImageRequest = UploadHeroImageRequest;
export type UploadAvatarImageResponse = UploadHeroImageResponse;

export interface AppearanceSettingsResponse {
  widget_locale: 'en' | 'ja' | 'fr' | 'zh-Hans' | 'pt-BR' | 'de' | null;
  theme: WidgetTheme;
  hero: WidgetHero;
  chat: WidgetChat;
  layout: WidgetLayout;
}

export type UpdateAppearanceSettingsRequest = AppearanceSettingsResponse;

export interface LlmSettingsResponse {
  configured: boolean;
  api_key_masked: string | null;
  model: string;
  max_tokens: number;
}

export interface UpdateLlmSettingsRequest {
  api_key?: string | null;
  model?: string;
  max_tokens?: number;
}

export interface TestLlmConnectionRequest {
  api_key?: string | null;
  model?: string;
}
