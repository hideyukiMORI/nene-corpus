/**
 * Default mock response shapes for all API endpoints.
 * Used to set up standard "happy path" mocks before each test.
 */

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

export const DEFAULT_SESSION = {
  session_id: 1,
  session_token: 'test-session-token-abc123',
};

export const DEFAULT_MESSAGE_RESPONSE = {
  message_id: 1,
  session_id: 1,
  role: 'assistant' as const,
  content: 'This is a test assistant response.',
  citations: [],
};

/** Convenience: build a message response with overrides */
export function makeMessageResponse(
  overrides: Partial<typeof DEFAULT_MESSAGE_RESPONSE>,
): typeof DEFAULT_MESSAGE_RESPONSE {
  return { ...DEFAULT_MESSAGE_RESPONSE, ...overrides };
}

/** Citation factory */
export function makeCitation(overrides: {
  chunk_id?: number;
  document_id?: number;
  source_id?: number;
  excerpt?: string;
  page_number?: number;
  section_label?: string;
}) {
  return {
    chunk_id: overrides.chunk_id ?? 1,
    document_id: overrides.document_id ?? 1,
    source_id: overrides.source_id ?? 1,
    excerpt: overrides.excerpt ?? 'This is a relevant excerpt from the knowledge base.',
    ...(overrides.page_number !== undefined && { page_number: overrides.page_number }),
    ...(overrides.section_label !== undefined && { section_label: overrides.section_label }),
  };
}
