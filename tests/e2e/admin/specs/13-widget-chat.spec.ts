/**
 * Category: Widget Chat Behaviour
 *
 * Fine-grained tests for the embed widget's chat interaction layer:
 * session lifecycle, input state, typing indicator, citations,
 * error recovery, and floating launcher.
 *
 * All tests target /widget-preview.html with mocked API routes.
 */

import { test, expect } from '@playwright/test';
import { DEFAULT_APPEARANCE } from '../fixtures/admin-api-mocks.js';

// ── Shared fixtures ───────────────────────────────────────────────────────────

const WIDGET_SESSION = { session_id: 1, session_token: 'widget-chat-test-token' };

const WIDGET_RESPONSE = {
  message_id: 1,
  session_id: 1,
  role: 'assistant' as const,
  content: 'Here is the answer to your question.',
  citations: [],
};

const WIDGET_WITH_CITATION = {
  message_id: 2,
  session_id: 1,
  role: 'assistant' as const,
  content: 'Returns are accepted within 30 days.',
  citations: [
    {
      chunk_id: 1,
      document_id: 1,
      source_id: 1,
      excerpt: 'Returns accepted within 30 days of purchase.',
      page_number: 5,
    },
  ],
};

/** Register default appearance + (optionally) a custom session mock. */
async function setupWidgetBase(
  page: import('@playwright/test').Page,
  appearance = DEFAULT_APPEARANCE,
): Promise<void> {
  await page.route('**/widget/appearance', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(appearance) }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Widget Chat Behaviour', () => {
  // ── Session lifecycle ────────────────────────────────────────────────────────

  test('13-01: submit disabled before session ready — enabled after session created', async ({
    page,
  }) => {
    await setupWidgetBase(page);

    // Hold the session request so the widget stays in "pending session" state
    let resolveSession!: () => void;
    const sessionHeld = new Promise<void>((resolve) => {
      resolveSession = resolve;
    });

    await page.route('**/chat/sessions', async (route) => {
      await sessionHeld;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WIDGET_SESSION),
      });
    });

    await page.goto('/widget-preview.html');

    // While session is pending, submit should be disabled
    await expect(page.locator('.nene-corpus-chat__submit')).toBeDisabled({ timeout: 5000 });

    // Release the session
    resolveSession();

    // Now submit should be enabled
    await expect(page.locator('.nene-corpus-chat__submit')).toBeEnabled({ timeout: 5000 });
  });

  test('13-02: Enter key sends message', async ({ page }) => {
    await setupWidgetBase(page);
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SESSION) }),
    );
    await page.route('**/chat/messages', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_RESPONSE) }),
    );

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });

    await page.locator('.nene-corpus-chat__input').fill('Question via Enter key');
    await page.locator('.nene-corpus-chat__input').press('Enter');

    // User bubble appears
    await expect(page.locator('.nene-corpus-chat__bubble--user')).toContainText(
      'Question via Enter key',
      { timeout: 8000 },
    );
    // Assistant response appears
    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({ timeout: 8000 });
  });

  // ── Session error states ─────────────────────────────────────────────────────

  test('13-03: POST /chat/sessions 500 — error shown, submit stays disabled', async ({ page }) => {
    await setupWidgetBase(page);
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error.' }),
      }),
    );

    await page.goto('/widget-preview.html');

    // Error element visible
    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
    // Submit remains disabled (no session token)
    await expect(page.locator('.nene-corpus-chat__submit')).toBeDisabled({ timeout: 4000 });
  });

  test('13-04: POST /chat/sessions network abort — error shown', async ({ page }) => {
    await setupWidgetBase(page);
    await page.route('**/chat/sessions', (route) => route.abort('failed'));

    await page.goto('/widget-preview.html');

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
  });

  // ── Loading / typing indicator ───────────────────────────────────────────────

  test('13-05: submit disabled while response loading — re-enabled after response', async ({
    page,
  }) => {
    await setupWidgetBase(page);
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SESSION) }),
    );

    let resolveMessage!: () => void;
    const messageHeld = new Promise<void>((resolve) => {
      resolveMessage = resolve;
    });
    await page.route('**/chat/messages', async (route) => {
      await messageHeld;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WIDGET_RESPONSE),
      });
    });

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });

    await page.locator('.nene-corpus-chat__input').fill('Loading test question');
    await page.locator('.nene-corpus-chat__submit').click();

    // While message is pending, submit should be disabled
    await expect(page.locator('.nene-corpus-chat__submit')).toBeDisabled({ timeout: 3000 });

    // Release the message
    resolveMessage();

    // After response, submit re-enabled
    await expect(page.locator('.nene-corpus-chat__submit')).toBeEnabled({ timeout: 5000 });
  });

  test('13-06: typing indicator visible while response loading', async ({ page }) => {
    await setupWidgetBase(page);
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SESSION) }),
    );

    let resolveMessage!: () => void;
    const messageHeld = new Promise<void>((resolve) => {
      resolveMessage = resolve;
    });
    await page.route('**/chat/messages', async (route) => {
      await messageHeld;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WIDGET_RESPONSE),
      });
    });

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });

    await page.locator('.nene-corpus-chat__input').fill('Typing indicator test');
    await page.locator('.nene-corpus-chat__submit').click();

    // Pending bubble contains the typing dots — check for the dots element specifically
    await expect(page.locator('.nene-corpus-chat__typing-dots')).toBeVisible({ timeout: 4000 });

    // Release
    resolveMessage();
    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({ timeout: 5000 });
  });

  // ── Input behaviour ──────────────────────────────────────────────────────────

  test('13-07: input cleared after successful send', async ({ page }) => {
    await setupWidgetBase(page);
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SESSION) }),
    );
    await page.route('**/chat/messages', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_RESPONSE) }),
    );

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });

    await page.locator('.nene-corpus-chat__input').fill('Clear me after send');
    await page.locator('.nene-corpus-chat__submit').click();

    // Input should be cleared immediately after submit (draft reset)
    await expect(page.locator('.nene-corpus-chat__input')).toHaveValue('', { timeout: 4000 });
  });

  // ── Citations ────────────────────────────────────────────────────────────────

  test('13-08: citation with page_number — citation-meta contains page number', async ({ page }) => {
    await setupWidgetBase(page);
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SESSION) }),
    );
    await page.route('**/chat/messages', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_WITH_CITATION) }),
    );

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });
    await page.locator('.nene-corpus-chat__input').fill('Return policy?');
    await page.locator('.nene-corpus-chat__submit').click();

    // Citation element visible
    await expect(page.locator('.nene-corpus-chat__citation').first()).toBeVisible({ timeout: 8000 });
    // Page number rendered (i18n: "p.5")
    await expect(page.locator('.nene-corpus-chat__citation-meta').first()).toContainText('5', {
      timeout: 4000,
    });
  });

  test('13-09: response with empty citations — no citation elements rendered', async ({ page }) => {
    await setupWidgetBase(page);
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SESSION) }),
    );
    await page.route('**/chat/messages', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_RESPONSE) }),
    );

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });
    await page.locator('.nene-corpus-chat__input').fill('No citations question');
    await page.locator('.nene-corpus-chat__submit').click();

    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({ timeout: 8000 });
    // No citation elements
    await expect(page.locator('.nene-corpus-chat__citation')).toHaveCount(0);
  });

  // ── Appearance error graceful fallback ───────────────────────────────────────

  test('13-10: widget appearance GET 500 — widget still renders with defaults', async ({ page }) => {
    // Appearance fails → widget should fall back gracefully and still render
    await page.route('**/widget/appearance', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"error"}' }),
    );
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SESSION) }),
    );

    await page.goto('/widget-preview.html');

    // Widget renders regardless — input or error visible (not a blank page)
    const input = page.locator('.nene-corpus-chat__input');
    const error = page.locator('.nene-corpus-chat__error');
    await expect(input.or(error)).toBeVisible({ timeout: 8000 });
  });

  // ── Floating launcher ────────────────────────────────────────────────────────

  test('13-11: floating launcher mode — launcher visible, chat panel hidden initially', async ({
    page,
  }) => {
    const floatingAppearance = {
      ...DEFAULT_APPEARANCE,
      layout: {
        ...DEFAULT_APPEARANCE.layout,
        position: 'bottom_right' as const,
        floating_launcher: true,
      },
    };
    await setupWidgetBase(page, floatingAppearance);
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SESSION) }),
    );

    await page.goto('/widget-preview.html');

    // Launcher button visible
    await expect(page.locator('.nene-corpus-chat__launcher')).toBeVisible({ timeout: 8000 });
    // Chat input NOT visible (panel is closed)
    await expect(page.locator('.nene-corpus-chat__input')).not.toBeVisible({ timeout: 4000 });
  });

  test('13-12: clicking launcher button — chat panel opens, input becomes visible', async ({
    page,
  }) => {
    const floatingAppearance = {
      ...DEFAULT_APPEARANCE,
      layout: {
        ...DEFAULT_APPEARANCE.layout,
        position: 'bottom_right' as const,
        floating_launcher: true,
      },
    };
    await setupWidgetBase(page, floatingAppearance);
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SESSION) }),
    );

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__launcher')).toBeVisible({ timeout: 8000 });

    // Click the launcher to open the panel
    await page.locator('.nene-corpus-chat__launcher').click();

    // Chat input now visible
    await expect(page.locator('.nene-corpus-chat__input')).toBeVisible({ timeout: 4000 });
  });
});
