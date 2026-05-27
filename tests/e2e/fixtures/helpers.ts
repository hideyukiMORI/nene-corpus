/**
 * Shared Playwright test helpers for NeNe Corpus widget tests.
 */

import { type Page, type Route } from '@playwright/test';
import {
  DEFAULT_APPEARANCE,
  DEFAULT_SESSION,
  DEFAULT_MESSAGE_RESPONSE,
} from './api-defaults.js';

export { DEFAULT_APPEARANCE, DEFAULT_SESSION, DEFAULT_MESSAGE_RESPONSE };

const WIDGET_PAGE = '/widget-preview.html';

// ──────────────────────────────────────────────────────────────────────────────
// Route mocking helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Mock the widget appearance endpoint */
export async function mockAppearance(
  page: Page,
  body: object = DEFAULT_APPEARANCE,
): Promise<void> {
  await page.route('**/widget/appearance', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }),
  );
}

/** Mock GET appearance to return an error (causes widget to use defaults) */
export async function mockAppearanceError(page: Page): Promise<void> {
  await page.route('**/widget/appearance', (route: Route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"error"}' }),
  );
}

/** Mock POST /chat/sessions */
export async function mockSession(
  page: Page,
  body: object = DEFAULT_SESSION,
  status = 200,
): Promise<void> {
  await page.route('**/chat/sessions', (route: Route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  );
}

/** Mock POST /chat/sessions to fail */
export async function mockSessionError(page: Page, status = 500): Promise<void> {
  await page.route('**/chat/sessions', (route: Route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Session creation failed.' }),
    }),
  );
}

/** Mock POST /chat/messages with a successful response */
export async function mockMessage(
  page: Page,
  body: object = DEFAULT_MESSAGE_RESPONSE,
): Promise<void> {
  await page.route('**/chat/messages', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  );
}

/** Mock POST /chat/messages with an error response */
export async function mockMessageError(
  page: Page,
  status: number,
  body: object,
): Promise<void> {
  await page.route('**/chat/messages', (route: Route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  );
}

/** Mock POST /chat/messages to abort (network error) */
export async function mockMessageAbort(page: Page): Promise<void> {
  await page.route('**/chat/messages', (route: Route) => route.abort('failed'));
}

/** Mock a sequence of message responses (first call, second call, ...) */
export async function mockMessageSequence(page: Page, responses: Array<{ status: number; body: object }>): Promise<void> {
  let callIndex = 0;
  await page.route('**/chat/messages', (route: Route) => {
    const resp = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return route.fulfill({
      status: resp.status,
      contentType: 'application/json',
      body: JSON.stringify(resp.body),
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Standard setup
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Set up the "happy path" — appearance, session, and default message mock.
 * Call this in most tests before navigating to the widget page.
 */
export async function setupHappyPath(
  page: Page,
  overrides: {
    appearance?: object;
    session?: object;
    message?: object;
  } = {},
): Promise<void> {
  await mockAppearance(page, overrides.appearance ?? DEFAULT_APPEARANCE);
  await mockSession(page, overrides.session ?? DEFAULT_SESSION);
  await mockMessage(page, overrides.message ?? DEFAULT_MESSAGE_RESPONSE);
}

// ──────────────────────────────────────────────────────────────────────────────
// Navigation & widget initialization
// ──────────────────────────────────────────────────────────────────────────────

/** Navigate to the widget page. Storage isolation is handled by playwright.config.ts storageState. */
export async function gotoWidget(page: Page): Promise<void> {
  await page.goto(WIDGET_PAGE);
}

/**
 * Navigate to the widget page and wait until the session is established
 * (input becomes enabled).
 */
export async function gotoWidgetReady(page: Page): Promise<void> {
  await gotoWidget(page);
  await page.waitForSelector('[aria-label="Chat message"]:not([disabled])', {
    timeout: 6000,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Interaction helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Type a message and click send */
export async function sendMessage(page: Page, text: string): Promise<void> {
  const input = page.locator('[aria-label="Chat message"]');
  await input.fill(text);
  await page.locator('button[type="submit"]').click();
}

/** Type a message and press Enter */
export async function sendMessageEnter(page: Page, text: string): Promise<void> {
  const input = page.locator('[aria-label="Chat message"]');
  await input.fill(text);
  await input.press('Enter');
}

/** Wait for the loading indicator to appear and then disappear */
export async function waitForResponse(page: Page): Promise<void> {
  // Wait for loading indicator
  await page.waitForSelector('text=Searching the corpus', { timeout: 4000 });
  // Wait for it to disappear
  await page.waitForSelector('text=Searching the corpus', { state: 'hidden', timeout: 10000 });
}

/** Get the last assistant message text */
export async function getLastAssistantText(page: Page): Promise<string> {
  // Wait for at least one assistant bubble-text to appear, then grab the last one.
  const textLocator = page.locator(
    '.nene-corpus-chat__bubble--assistant .nene-corpus-chat__bubble-text',
  );
  await textLocator.last().waitFor({ timeout: 8000 });
  return textLocator.last().innerText();
}

/** Get the error message text (if shown) */
export async function getErrorText(page: Page): Promise<string | null> {
  const error = page.locator('.nc-chat-error');
  try {
    await error.waitFor({ timeout: 3000 });
    return error.innerText();
  } catch {
    return null;
  }
}
