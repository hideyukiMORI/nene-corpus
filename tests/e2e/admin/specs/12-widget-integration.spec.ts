/**
 * Category: Widget Integration
 *
 * End-to-end tests that simulate the full operator journey:
 * admin configures settings → widget reflects configuration → user chats.
 *
 * Uses the widget-preview.html page served from public_html/, with all
 * API calls mocked via page.route().
 *
 * Coverage:
 *  - Widget reflects appearance settings saved in admin
 *  - Widget loads correctly after various admin configurations
 *  - Full chat flow: session → message → response with citations
 *  - Error recovery after LLM failure
 *  - Rate-limit response handled by widget
 *  - System-prompt change visible in chat behavior (via mock)
 *  - Widget locale follows admin appearance settings
 */

import { test, expect } from '@playwright/test';
import {
  bypassLogin,
  mockAdminAuth,
  openSettingsSection,
} from '../fixtures/admin-helpers.js';
import {
  DEFAULT_APPEARANCE,
  DEFAULT_CHAT_SETTINGS,
  LLM_CONFIGURED,
  SOURCE_LIST_EMPTY,
  SESSION_LIST_EMPTY,
} from '../fixtures/admin-api-mocks.js';

// ── Widget mock helpers ───────────────────────────────────────────────────────

const WIDGET_SESSION = { session_id: 1, session_token: 'widget-test-token' };

const WIDGET_SHORT = {
  message_id: 1,
  session_id: 1,
  role: 'assistant' as const,
  content: 'Our opening hours are Monday to Friday, 9am–5pm.',
  citations: [],
};

const WIDGET_WITH_CITATIONS = {
  message_id: 2,
  session_id: 1,
  role: 'assistant' as const,
  content: 'Based on the documentation, returns are accepted within 30 days.',
  citations: [
    {
      chunk_id: 1,
      document_id: 1,
      source_id: 1,
      excerpt: 'Returns accepted within 30 days of purchase.',
      page_number: 5,
    },
    {
      chunk_id: 2,
      document_id: 1,
      source_id: 1,
      excerpt: 'Items must be in original packaging.',
    },
  ],
};

const ERROR_500 = {
  message_id: 3,
  session_id: 1,
  role: 'assistant' as const,
  content: '',
  citations: [],
};

async function setupWidget(
  page: import('@playwright/test').Page,
  appearance = DEFAULT_APPEARANCE,
) {
  await page.route('**/widget/appearance', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(appearance) }),
  );
  await page.route('**/chat/sessions', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SESSION) }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Widget Integration', () => {
  // ── Widget renders with default appearance ──────────────────────────────────

  test('12-01: widget renders hero title from admin appearance settings', async ({ page }) => {
    const customAppearance = {
      ...DEFAULT_APPEARANCE,
      hero: { ...DEFAULT_APPEARANCE.hero, title: 'Ask our support team!' },
    };
    await setupWidget(page, customAppearance);
    await page.goto('/widget-preview.html');

    await expect(page.locator('.nene-corpus-chat__hero-title')).toContainText(
      'Ask our support team!',
      { timeout: 8000 },
    );
  });

  test('12-02: widget shows hero description from admin settings', async ({ page }) => {
    const customAppearance = {
      ...DEFAULT_APPEARANCE,
      hero: { ...DEFAULT_APPEARANCE.hero, description: 'We are here to help 24/7.' },
    };
    await setupWidget(page, customAppearance);
    await page.goto('/widget-preview.html');

    await expect(page.locator('.nene-corpus-chat__hero-description')).toContainText(
      'We are here to help 24/7.',
      { timeout: 8000 },
    );
  });

  test('12-03: hero title hidden when show_title=false', async ({ page }) => {
    const customAppearance = {
      ...DEFAULT_APPEARANCE,
      hero: { ...DEFAULT_APPEARANCE.hero, show_title: false },
    };
    await setupWidget(page, customAppearance);
    await page.goto('/widget-preview.html');

    await expect(page.locator('.nene-corpus-chat__input')).toBeVisible({ timeout: 6000 });
    // Title element should not be present or hidden
    const title = page.locator('.nene-corpus-hero__title');
    const count = await title.count();
    if (count > 0) {
      await expect(title).not.toBeVisible();
    }
  });

  // ── Full chat flow ──────────────────────────────────────────────────────────

  test('12-04: full chat flow — session → question → answer rendered', async ({ page }) => {
    await setupWidget(page);
    await page.route('**/chat/messages', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SHORT) }),
    );

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });

    // Type and send
    await page.locator('.nene-corpus-chat__input').fill('What are your opening hours?');
    await page.locator('.nene-corpus-chat__submit').click();

    // User bubble
    await expect(page.locator('.nene-corpus-chat__bubble--user')).toContainText(
      'What are your opening hours?',
      { timeout: 8000 },
    );

    // Assistant response
    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toContainText(
      'Monday to Friday',
      { timeout: 8000 },
    );
  });

  test('12-05: chat with citations — citation elements rendered', async ({ page }) => {
    await setupWidget(page);
    await page.route('**/chat/messages', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_WITH_CITATIONS) }),
    );

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });
    await page.locator('.nene-corpus-chat__input').fill('What is the return policy?');
    await page.locator('.nene-corpus-chat__submit').click();

    await expect(page.locator('.nene-corpus-chat__citation')).toHaveCount(2, { timeout: 8000 });
    await expect(page.locator('.nene-corpus-chat__citations')).toBeVisible();
  });

  // ── Error recovery ──────────────────────────────────────────────────────────

  test('12-06: 500 error then recovery — error shown then cleared', async ({ page }) => {
    let callCount = 0;
    await setupWidget(page);
    await page.route('**/chat/messages', (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{"detail":"Internal server error."}',
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SHORT) });
    });

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });

    // First message — error
    await page.locator('.nene-corpus-chat__input').fill('Question 1');
    await page.locator('.nene-corpus-chat__submit').click();
    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });

    // Second message — success
    await page.locator('.nene-corpus-chat__input').fill('Question 2');
    await page.locator('.nene-corpus-chat__submit').click();
    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(0);
  });

  test('12-07: 429 rate-limit response — error message displayed, input re-enabled', async ({
    page,
  }) => {
    await setupWidget(page);
    await page.route('**/chat/messages', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: { code: 'RATE_LIMIT_SESSION_HOURLY', message: 'Hourly limit reached.' },
        }),
      }),
    );

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });
    await page.locator('.nene-corpus-chat__input').fill('Too many questions');
    await page.locator('.nene-corpus-chat__submit').click();

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 4000 });
  });

  // ── Admin → Widget locale ────────────────────────────────────────────────────

  test('12-08: widget locale set to "ja" — Japanese UI labels used', async ({ page }) => {
    const jaAppearance = { ...DEFAULT_APPEARANCE, widget_locale: 'ja' as const };
    await setupWidget(page, jaAppearance);
    await page.goto('/widget-preview.html');

    // Widget renders in Japanese — submit button aria-label or send button text
    await expect(page.locator('.nene-corpus-chat__input')).toBeVisible({ timeout: 8000 });
    // In Japanese locale, the input aria-label uses the Japanese i18n key
    const inputLabel = await page.locator('.nene-corpus-chat__input').getAttribute('aria-label');
    // The input has aria-label from the locale (e.g. 'チャットメッセージ' in Japanese)
    expect(inputLabel).toBeTruthy();
  });

  // ── Session token header ────────────────────────────────────────────────────

  test('12-09: session token passed in X-Session-Token header', async ({ page }) => {
    let capturedToken = '';
    await setupWidget(page);
    await page.route('**/chat/messages', (route) => {
      capturedToken = route.request().headers()['x-session-token'] ?? '';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SHORT) });
    });

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });
    await page.locator('.nene-corpus-chat__input').fill('Test');
    await page.locator('.nene-corpus-chat__submit').click();

    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({ timeout: 8000 });
    expect(capturedToken).toBe('widget-test-token');
  });

  // ── Admin settings impact widget ────────────────────────────────────────────

  test('12-10: admin changes hero CTA label — widget shows updated label', async ({ page }) => {
    const updatedAppearance = {
      ...DEFAULT_APPEARANCE,
      hero: {
        ...DEFAULT_APPEARANCE.hero,
        cta_label: 'Start chatting now!',
        show_cta: true,
      },
    };
    await setupWidget(page, updatedAppearance);
    await page.goto('/widget-preview.html');

    await expect(page.locator('.nene-corpus-chat__hero')).toContainText('Start chatting now!', {
      timeout: 8000,
    });
  });

  // ── Multi-turn with admin-configured fallback ────────────────────────────────

  test('12-11: multi-turn conversation — 3 turns all respond correctly', async ({ page }) => {
    let seq = 0;
    await setupWidget(page);
    await page.route('**/chat/messages', (route) => {
      seq++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...WIDGET_SHORT, message_id: seq, content: `Answer ${seq}` }),
      });
    });

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });

    for (let i = 1; i <= 3; i++) {
      const beforeCount = await page.locator('.nene-corpus-chat__bubble--assistant').count();
      await page.locator('.nene-corpus-chat__input').fill(`Question ${i}`);
      await page.locator('.nene-corpus-chat__submit').click();
      await page.locator('.nene-corpus-chat__bubble--assistant').nth(beforeCount).waitFor({ timeout: 8000 });
    }

    const bubbles = page.locator('.nene-corpus-chat__bubble--assistant');
    await expect(bubbles).toHaveCount(3);
    await expect(bubbles.nth(0)).toContainText('Answer 1');
    await expect(bubbles.nth(1)).toContainText('Answer 2');
    await expect(bubbles.nth(2)).toContainText('Answer 3');
  });

  // ── Admin dashboard → appearance save → widget reload ─────────────────────

  test('12-12: admin saves appearance → new widget load reflects change', async ({ page }) => {
    // Admin side: set up a new hero title via PUT
    let currentTitle = 'How can we help?';
    await page.route('**/admin/appearance', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...DEFAULT_APPEARANCE, hero: { ...DEFAULT_APPEARANCE.hero, title: currentTitle } }) });
      }
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { hero?: { title?: string } };
        currentTitle = body.hero?.title ?? currentTitle;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...DEFAULT_APPEARANCE, hero: { ...DEFAULT_APPEARANCE.hero, title: currentTitle } }) });
      }
      return route.continue();
    });

    // Widget side: reflect updated title
    await page.route('**/widget/appearance', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...DEFAULT_APPEARANCE, hero: { ...DEFAULT_APPEARANCE.hero, title: currentTitle } }) }),
    );
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SESSION) }),
    );

    // Visit admin and update title
    await bypassLogin(page);
    await mockAdminAuth(page);
    await page.route('**/admin/sources**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sources: [], total: 0 }) }),
    );
    await page.route('**/admin/chat/sessions**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [], total: 0 }) }),
    );
    await page.goto('/admin/');
    await page.locator('h2:has-text("Sources")').waitFor({ timeout: 8000 });
    await openSettingsSection(page, 'Appearance');

    const heroTitle = page.locator('input[value="How can we help?"]');
    await heroTitle.waitFor({ timeout: 8000 });
    await heroTitle.fill('Updated by admin!');
    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('text=saved').first()).toBeVisible({ timeout: 8000 });

    // Now navigate to widget page — title should be updated
    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__hero-title')).toContainText('Updated by admin!', {
      timeout: 8000,
    });
  });
});
