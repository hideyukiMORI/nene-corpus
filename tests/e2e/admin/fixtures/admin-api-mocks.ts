/**
 * Default mock response shapes for the Admin SPA API endpoints.
 *
 * All constants here are pure data — no page.route() calls.
 * Import them in spec files and pass to the helper functions in admin-helpers.ts.
 */

// ── Auth ──────────────────────────────────────────────────────────────────────

export const ADMIN_TOKEN = 'test-admin-jwt-token-abcdef';

export const DEFAULT_LOGIN_RESPONSE = {
  access_token: ADMIN_TOKEN,
  token_type: 'bearer',
  expires_at: '2099-01-01T00:00:00Z',
};

export const DEFAULT_ME_RESPONSE = {
  id: 1,
  email: 'admin@example.com',
  role: 'admin',
};

// ── LLM Settings ──────────────────────────────────────────────────────────────

export const LLM_CONFIGURED = {
  configured: true,
  api_key_masked: 'sk-ant-***...***XYZ',
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1024,
};

export const LLM_NOT_CONFIGURED = {
  configured: false,
  api_key_masked: null,
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1024,
};

// ── Chat Settings ─────────────────────────────────────────────────────────────

export const DEFAULT_CHAT_SETTINGS = {
  system_prompt: null,
  fallback_message: null,
  default_system_prompt: 'You are a helpful assistant answering questions based on the corpus.',
  default_fallback_message: 'I could not find relevant information in the knowledge base.',
};

export const CUSTOM_CHAT_SETTINGS = {
  system_prompt: 'Custom system prompt for testing.',
  fallback_message: 'Custom fallback for testing.',
  default_system_prompt: DEFAULT_CHAT_SETTINGS.default_system_prompt,
  default_fallback_message: DEFAULT_CHAT_SETTINGS.default_fallback_message,
};

// ── Appearance ────────────────────────────────────────────────────────────────

export const DEFAULT_APPEARANCE = {
  widget_locale: null,
  theme: {
    color_primary: '#2563eb',
    color_surface: '#ffffff',
    color_text: '#1a1a2e',
    radius_panel: '0.75rem',
    radius_control: '0.5rem',
    max_width: '480px',
  },
  hero: {
    title: 'How can we help?',
    description: 'Ask a question about our products and services.',
    cta_label: 'Ask a question',
    show_title: true,
    show_description: true,
    show_cta: true,
    show_image: false,
    image_url: null,
    image_alt: null,
    gap_after: '1rem',
    padding_bottom: '1rem',
    show_divider: true,
  },
  chat: {
    user_avatar_mode: 'silhouette',
    show_assistant_avatar: true,
    assistant_avatar_url: null,
    assistant_avatar_alt: null,
  },
  layout: {
    max_height: '32rem',
    position: 'inline',
    offset_x: 16,
    offset_y: 16,
    floating_launcher: false,
  },
  custom_css: null,
};

// ── Usage Limits ──────────────────────────────────────────────────────────────

export const DEFAULT_LIMITS = {
  max_message_chars: 800,
  message_interval_seconds: 10,
  session_requests_per_hour: 20,
  ip_requests_per_hour: 60,
  daily_requests_per_ip: 200,
  daily_requests_global: 2000,
  daily_tokens_per_ip: 100000,
  daily_tokens_global: 1000000,
};

// ── Sources ───────────────────────────────────────────────────────────────────

export function makeSource(overrides: Partial<{
  source_id: number;
  name: string;
  source_type: 'csv' | 'pdf' | 'text';
  status: 'pending' | 'processing' | 'ready' | 'failed';
  document_count: number;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}> = {}) {
  return {
    source_id: overrides.source_id ?? 1,
    name: overrides.name ?? 'Test Source',
    source_type: overrides.source_type ?? 'text',
    status: overrides.status ?? 'ready',
    document_count: overrides.document_count ?? 3,
    chunk_count: overrides.chunk_count ?? 12,
    created_at: overrides.created_at ?? '2025-01-15T10:00:00Z',
    updated_at: overrides.updated_at ?? '2025-01-15T10:00:00Z',
  };
}

export const SOURCE_LIST_EMPTY = { sources: [], total: 0 };

export const SOURCE_LIST_ONE = {
  sources: [makeSource()],
  total: 1,
};

export const SOURCE_LIST_THREE = {
  sources: [
    makeSource({ source_id: 1, name: 'Product FAQ', source_type: 'text', document_count: 5, chunk_count: 20 }),
    makeSource({ source_id: 2, name: 'User Manual', source_type: 'pdf', document_count: 12, chunk_count: 48 }),
    makeSource({ source_id: 3, name: 'Data Import', source_type: 'csv', document_count: 30, chunk_count: 90 }),
  ],
  total: 3,
};

// ── Documents ─────────────────────────────────────────────────────────────────

export function makeDocument(overrides: Partial<{
  document_id: number;
  source_id: number;
  title: string;
  position: number;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}> = {}) {
  return {
    document_id: overrides.document_id ?? 1,
    source_id: overrides.source_id ?? 1,
    title: overrides.title ?? 'Sample Document',
    position: overrides.position ?? 0,
    chunk_count: overrides.chunk_count ?? 4,
    created_at: overrides.created_at ?? '2025-01-15T10:00:00Z',
    updated_at: overrides.updated_at ?? '2025-01-15T10:00:00Z',
  };
}

export function makeDocumentDetail(overrides: Partial<{
  document_id: number;
  source_id: number;
  title: string;
  content: string;
  position: number;
  chunk_count: number;
}> = {}) {
  return {
    document_id: overrides.document_id ?? 1,
    source_id: overrides.source_id ?? 1,
    title: overrides.title ?? 'Sample Document',
    content: overrides.content ?? 'This is the full content of the sample document for testing purposes.',
    position: overrides.position ?? 0,
    chunk_count: overrides.chunk_count ?? 4,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  };
}

export const DOCUMENT_LIST_THREE = {
  documents: [
    makeDocument({ document_id: 1, title: 'Document Alpha' }),
    makeDocument({ document_id: 2, title: 'Document Beta' }),
    makeDocument({ document_id: 3, title: 'Document Gamma' }),
  ],
  total: 3,
  limit: 50,
  offset: 0,
};

export const DOCUMENT_LIST_EMPTY = { documents: [], total: 0, limit: 50, offset: 0 };

export function makeChunk(overrides: Partial<{
  chunk_id: number;
  chunk_index: number;
  content: string;
  page_number: number | null;
  section_label: string | null;
  token_count: number | null;
}> = {}) {
  return {
    chunk_id: overrides.chunk_id ?? 1,
    chunk_index: overrides.chunk_index ?? 0,
    content: overrides.content ?? 'This is chunk content for testing.',
    page_number: overrides.page_number ?? null,
    section_label: overrides.section_label ?? null,
    token_count: overrides.token_count ?? 42,
  };
}

// ── Conversation Sessions ─────────────────────────────────────────────────────

export function makeSession(overrides: Partial<{
  session_id: number;
  message_count: number;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  client_ip: string | null;
  user_agent: string | null;
  referer: string | null;
}> = {}) {
  return {
    session_id: overrides.session_id ?? 1,
    message_count: overrides.message_count ?? 4,
    created_at: overrides.created_at ?? '2025-01-15T10:00:00Z',
    updated_at: overrides.updated_at ?? '2025-01-15T10:05:00Z',
    last_message_at: overrides.last_message_at ?? '2025-01-15T10:05:00Z',
    client_ip: overrides.client_ip ?? null,
    user_agent: overrides.user_agent ?? null,
    referer: overrides.referer ?? null,
  };
}

export const SESSION_LIST_EMPTY = { sessions: [], total: 0 };

export const SESSION_LIST_THREE = {
  sessions: [
    makeSession({ session_id: 1, message_count: 6 }),
    makeSession({ session_id: 2, message_count: 2 }),
    makeSession({ session_id: 3, message_count: 10 }),
  ],
  total: 3,
};

export function makeMessage(overrides: Partial<{
  message_id: number;
  role: 'user' | 'assistant';
  content: string;
  citations: unknown[];
  created_at: string;
}> = {}) {
  return {
    message_id: overrides.message_id ?? 1,
    role: overrides.role ?? 'user',
    content: overrides.content ?? 'Hello, what are your opening hours?',
    citations: overrides.citations ?? [],
    created_at: overrides.created_at ?? '2025-01-15T10:00:00Z',
  };
}

export const SESSION_MESSAGES = {
  session_id: 1,
  messages: [
    makeMessage({ message_id: 1, role: 'user', content: 'What are your opening hours?' }),
    makeMessage({ message_id: 2, role: 'assistant', content: 'We are open Monday–Friday 9am–5pm.' }),
    makeMessage({ message_id: 3, role: 'user', content: 'Do you have weekend hours?' }),
    makeMessage({ message_id: 4, role: 'assistant', content: 'We are closed on weekends.' }),
  ],
};

// ── Ingestion ─────────────────────────────────────────────────────────────────

export const CSV_PREVIEW = {
  headers: ['title', 'description', 'category'],
  sample_rows: [
    ['Product A', 'Description of product A', 'Electronics'],
    ['Product B', 'Description of product B', 'Clothing'],
  ],
  detected_delimiter: ',',
  row_count: 50,
};

export const PDF_PREVIEW = {
  page_count: 10,
  sample_text: 'This is a sample from the first page of the PDF document...',
};

export const CREATE_SOURCE_RESULT = {
  source_id: 99,
  name: 'New Source',
  status: 'processing' as const,
  document_count: 0,
  chunk_count: 0,
  created_at: '2025-01-15T12:00:00Z',
  updated_at: '2025-01-15T12:00:00Z',
};

// ── Notifications ─────────────────────────────────────────────────────────────

// Matches NotificationSettings interface in packages/api-client/src/notifications.ts
export const DEFAULT_NOTIFICATION_SETTINGS = {
  smtp_host: '',
  smtp_port: 587,
  smtp_username: '',
  smtp_password_set: false,
  smtp_encryption: 'tls' as const,
  smtp_from_address: '',
  smtp_from_name: '',
  smtp_configured: false,
  notify_email: '',
  rate_limit_notify_enabled: false,
  rate_limit_cooldown_minutes: 60,
  daily_report_enabled: false,
  daily_report_token: '',
};

// Notification settings with SMTP configured (enables test-mail button)
export const CONFIGURED_NOTIFICATION_SETTINGS = {
  ...DEFAULT_NOTIFICATION_SETTINGS,
  smtp_host: 'smtp.example.com',
  smtp_port: 587,
  smtp_username: 'notifications@example.com',
  smtp_password_set: true,
  smtp_from_address: 'noreply@example.com',
  smtp_from_name: 'NeNe Corpus',
  smtp_configured: true,
  notify_email: 'admin@example.com',
};
