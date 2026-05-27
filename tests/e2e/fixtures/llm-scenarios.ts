/**
 * LLM Response Scenario Library
 *
 * Based on research of all Claude Messages API response patterns:
 * - stop_reason: end_turn, max_tokens, refusal (mapped to backend error)
 * - Content variations: text length, language, special characters
 * - Error mappings: 429, 500, 503, network abort
 *
 * Each scenario maps to what POST /chat/messages returns after the PHP
 * backend processes (or fails to process) the Claude API response.
 */

import { makeMessageResponse, makeCitation } from './api-defaults.js';

// ──────────────────────────────────────────────────────────────────────────────
// Normal text response patterns (stop_reason: end_turn)
// ──────────────────────────────────────────────────────────────────────────────

/** Single short sentence — most common response */
export const SHORT_ANSWER = makeMessageResponse({
  content: 'Our store is open Monday to Friday, 9 AM to 6 PM.',
  citations: [],
});

/** Multi-sentence answer — typical informational response */
export const MEDIUM_ANSWER = makeMessageResponse({
  content:
    'Our return policy allows returns within 30 days of purchase. ' +
    'Items must be in their original condition with all tags attached. ' +
    'Please bring your receipt or order confirmation to process the return.',
  citations: [],
});

/** Multi-paragraph answer (newlines from Claude) */
export const LONG_ANSWER = makeMessageResponse({
  content:
    'Thank you for your question about our product line.\n\n' +
    'We offer three main categories: Standard, Professional, and Enterprise. ' +
    'Each tier comes with different feature sets and support levels.\n\n' +
    'The Standard plan includes basic features suitable for individuals and small teams. ' +
    'The Professional plan adds advanced analytics and priority support. ' +
    'The Enterprise plan provides custom integrations, SLA guarantees, and dedicated account management.\n\n' +
    'Pricing is available on our website or through a direct sales consultation.',
  citations: [],
});

/** Very long answer — stress test for rendering (>500 chars) */
export const VERY_LONG_ANSWER = makeMessageResponse({
  content: Array(12)
    .fill(
      'This is a detailed response that covers many aspects of our product and services. ' +
        'Our team has been working hard to ensure quality and reliability across all features. ',
    )
    .join(''),
  citations: [],
});

/** Single word answer */
export const SINGLE_WORD_ANSWER = makeMessageResponse({
  content: 'Yes.',
  citations: [],
});

// ──────────────────────────────────────────────────────────────────────────────
// Fallback / no-information patterns
// ──────────────────────────────────────────────────────────────────────────────

/** Default fallback message (corpus has no relevant information) */
export const FALLBACK_NO_INFO = makeMessageResponse({
  content: 'I do not have information about that in my knowledge base.',
  citations: [],
});

/** Custom fallback message (operator-configured) */
export const FALLBACK_CUSTOM = makeMessageResponse({
  content: 'Sorry, I cannot find relevant information about this topic. Please contact support.',
  citations: [],
});

// ──────────────────────────────────────────────────────────────────────────────
// Multilingual / Unicode patterns
// ──────────────────────────────────────────────────────────────────────────────

/** Japanese answer — primary locale */
export const JAPANESE_ANSWER = makeMessageResponse({
  content: '営業時間は月曜日から金曜日の午前9時から午後6時までです。土日祝日はお休みとなります。',
  citations: [],
});

/** Emoji in response */
export const EMOJI_ANSWER = makeMessageResponse({
  content: '✅ Yes, we do offer a free trial! 🎉 Sign up at our website to get started. 🚀',
  citations: [],
});

/** Mixed Japanese and English */
export const MIXED_LANG_ANSWER = makeMessageResponse({
  content: 'Our latest model (最新モデル) is now available. Price starts at ¥12,800.',
  citations: [],
});

/** Diacritics and accented characters */
export const DIACRITIC_ANSWER = makeMessageResponse({
  content: 'Our café is located in the naïve neighborhood. Über-fast delivery available.',
  citations: [],
});

// ──────────────────────────────────────────────────────────────────────────────
// Security / encoding edge cases
// ──────────────────────────────────────────────────────────────────────────────

/**
 * HTML special characters in content.
 * React renders as plain text (not HTML), so these should appear literally.
 * Verifies XSS protection in the widget.
 */
export const HTML_SPECIAL_CHARS = makeMessageResponse({
  content: 'Price is <strong>$9.99</strong> & includes "shipping". Use code AT&T20 for 20% off.',
  citations: [],
});

/**
 * XSS attempt in LLM content.
 * The widget must render this as plain text, not execute it.
 */
export const XSS_IN_CONTENT = makeMessageResponse({
  content: '<script>alert("xss")</script> Our product is available now.',
  citations: [],
});

/** Template literal / bracket characters */
export const BRACKET_CHARS = makeMessageResponse({
  content: 'Use the format {key: value} or [item1, item2] in your configuration file.',
  citations: [],
});

/** URL in response */
export const URL_IN_CONTENT = makeMessageResponse({
  content:
    'Visit https://example.com/products?category=electronics&sort=price for the full catalog.',
  citations: [],
});

// ──────────────────────────────────────────────────────────────────────────────
// max_tokens truncation (content cut off mid-sentence)
// ──────────────────────────────────────────────────────────────────────────────

/** Truncated mid-sentence — Claude hit max_tokens limit */
export const TRUNCATED_MID_SENTENCE = makeMessageResponse({
  content: 'Our refund policy covers all products purchased within the last 30 days. To initiate a refund, please visit our website and navigate to the "Returns" section where you can fill out the refund reques',
  citations: [],
});

/** Truncated mid-word */
export const TRUNCATED_MID_WORD = makeMessageResponse({
  content: 'Please contact our support team at supp',
  citations: [],
});

// ──────────────────────────────────────────────────────────────────────────────
// Citation patterns
// ──────────────────────────────────────────────────────────────────────────────

/** Single citation */
export const ANSWER_WITH_SINGLE_CITATION = makeMessageResponse({
  content: 'Our return policy is 30 days.',
  citations: [
    makeCitation({ chunk_id: 1, excerpt: 'Returns accepted within 30 days of purchase.' }),
  ],
});

/** Multiple citations from different documents */
export const ANSWER_WITH_MULTIPLE_CITATIONS = makeMessageResponse({
  content: 'We accept Visa, Mastercard, and PayPal.',
  citations: [
    makeCitation({ chunk_id: 1, excerpt: 'Accepted payment methods: Visa and Mastercard.' }),
    makeCitation({
      chunk_id: 2,
      document_id: 2,
      excerpt: 'PayPal is available for online orders.',
    }),
    makeCitation({
      chunk_id: 3,
      document_id: 3,
      excerpt: 'Secure checkout with 256-bit encryption.',
    }),
  ],
});

/** Citation with page number */
export const ANSWER_WITH_PAGE_NUMBER = makeMessageResponse({
  content: 'See the product manual for installation instructions.',
  citations: [
    makeCitation({
      chunk_id: 1,
      excerpt: 'Installation: Connect the power cable first.',
      page_number: 12,
    }),
  ],
});

/** Citation with long excerpt */
export const ANSWER_WITH_LONG_EXCERPT = makeMessageResponse({
  content: 'The warranty covers manufacturing defects.',
  citations: [
    makeCitation({
      chunk_id: 1,
      excerpt:
        'Limited Warranty: This product is warranted against defects in materials and workmanship for a period of two (2) years from the date of original retail purchase. This warranty does not cover damage resulting from accident, misuse, abuse, neglect, or unauthorized modification.',
    }),
  ],
});

/** Citation with HTML special chars in excerpt */
export const ANSWER_WITH_SPECIAL_EXCERPT = makeMessageResponse({
  content: 'Pricing information available.',
  citations: [
    makeCitation({
      chunk_id: 1,
      excerpt: 'Price: $9.99 <sale> & free shipping on orders > $50.',
    }),
  ],
});

// ──────────────────────────────────────────────────────────────────────────────
// Error response bodies (HTTP 4xx / 5xx)
// ──────────────────────────────────────────────────────────────────────────────

export const ERROR_BODIES = {
  // Rate limit patterns (429)
  RATE_LIMIT_SESSION_HOURLY: {
    status: 429,
    body: { detail: 'Session rate limit exceeded. Please wait before sending another message.' },
  },
  RATE_LIMIT_SESSION_INTERVAL: {
    status: 429,
    body: { detail: 'Please wait a moment before sending another message.' },
  },
  RATE_LIMIT_IP_HOURLY: {
    status: 429,
    body: { detail: 'Too many messages from this IP address. Please try again later.' },
  },
  RATE_LIMIT_DAILY_IP: {
    status: 429,
    body: { detail: 'Daily message limit reached for this IP. Please try again tomorrow.' },
  },
  RATE_LIMIT_DAILY_GLOBAL: {
    status: 429,
    body: { detail: 'Service is temporarily busy. Please try again in a few minutes.' },
  },
  RATE_LIMIT_MESSAGE_TOO_LONG: {
    status: 429,
    body: {
      errors: [{ field: 'content', message: 'Message exceeds the maximum allowed length.' }],
    },
  },
  RATE_LIMIT_TOKEN_BUDGET: {
    status: 429,
    body: { detail: 'Daily token budget exceeded. The service will resume tomorrow.' },
  },

  // Server / LLM errors (500)
  LLM_EMPTY_RESPONSE: {
    status: 500,
    body: { detail: 'Claude response did not contain assistant text.' },
  },
  LLM_REFUSAL: {
    status: 500,
    body: { detail: 'Claude response did not contain assistant text.' },
  },
  LLM_MAX_ROUNDS: {
    status: 500,
    body: { detail: 'Exceeded maximum Claude tool_use rounds.' },
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    body: { detail: 'An unexpected error occurred. Please try again.' },
  },

  // Upstream unavailable
  SERVICE_UNAVAILABLE: {
    status: 503,
    body: { detail: 'The AI service is temporarily unavailable. Please try again shortly.' },
  },
  // Claude API overloaded (529 from Anthropic, surfaces as 503 or 500 to widget)
  ANTHROPIC_OVERLOADED: {
    status: 503,
    body: { detail: 'The AI service is overloaded. Please try again in a few minutes.' },
  },

  // Bad request
  INVALID_SESSION: {
    status: 400,
    body: { detail: 'Invalid or expired session token.' },
  },
  MISSING_CONTENT: {
    status: 422,
    body: { errors: [{ field: 'content', message: 'Content is required.' }] },
  },
} as const;
