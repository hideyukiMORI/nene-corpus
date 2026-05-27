/**
 * Category: Session Persistence
 *
 * Tests that the session token is stored in sessionStorage,
 * reused on revisit within the same tab context,
 * and that a new session is created when storage is cleared.
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockSession,
  mockMessage,
  gotoWidget,
  gotoWidgetReady,
  DEFAULT_SESSION,
} from '../fixtures/helpers.js';
import { SHORT_ANSWER } from '../fixtures/llm-scenarios.js';

const SESSION_KEY = 'nene-corpus.session_token';

test.describe('Session Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppearance(page);
    await mockMessage(page, SHORT_ANSWER);
  });

  test('10-01: session token stored in sessionStorage after session created', async ({ page }) => {
    await mockSession(page);
    await gotoWidget(page);

    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 6000 });

    const token = await page.evaluate(
      (key: string) => window.sessionStorage.getItem(key),
      SESSION_KEY,
    );
    expect(token).toBe(DEFAULT_SESSION.session_token);
  });

  test('10-02: existing session reused — no new session API call', async ({ page }) => {
    // Pre-seed sessionStorage via addInitScript so it runs before any widget code.
    // (Navigating to about:blank first would cause a SecurityError because that
    // opaque origin has no access to the Storage API.)
    await page.addInitScript(
      ([key, token]: [string, string]) => window.sessionStorage.setItem(key, token),
      [SESSION_KEY, 'pre-seeded-token'],
    );

    let sessionCallCount = 0;
    await page.route('**/chat/sessions', (route) => {
      sessionCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_SESSION),
      });
    });

    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 6000 });

    // Session API must NOT be called (token already in storage)
    expect(sessionCallCount).toBe(0);
  });

  test('10-03: new session created when sessionStorage is cleared', async ({ page }) => {
    let sessionCallCount = 0;
    await page.route('**/chat/sessions', (route) => {
      sessionCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_SESSION),
      });
    });

    // First load: creates session
    await gotoWidget(page);
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 6000 });
    expect(sessionCallCount).toBe(1);

    // Clear storage and reload
    await page.evaluate((key: string) => window.sessionStorage.removeItem(key), SESSION_KEY);
    await page.reload();
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 6000 });

    // Second session call must be made
    expect(sessionCallCount).toBe(2);
  });

  test('10-04: session token used as X-Session-Token header when sending', async ({ page }) => {
    await mockSession(page);
    let capturedToken: string | null = null;
    await page.route('**/chat/messages', (route) => {
      capturedToken = route.request().headers()['x-session-token'] ?? null;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SHORT_ANSWER),
      });
    });

    await gotoWidgetReady(page);
    await page.locator('.nene-corpus-chat__input').fill('header check');
    await page.locator('.nene-corpus-chat__submit').click();

    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({
      timeout: 8000,
    });
    expect(capturedToken).toBe(DEFAULT_SESSION.session_token);
  });
});
