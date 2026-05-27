/**
 * Category: Error Handling
 *
 * Tests the widget's response to:
 * - 500 Internal Server Error (LLM failures, backend crashes)
 * - 503 Service Unavailable (Anthropic overloaded / upstream down)
 * - Network abort / connection refused
 * - Malformed / non-JSON response body
 * - Invalid session (400)
 * - Error state cleared on next successful message
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockSession,
  mockMessageError,
  mockMessageAbort,
  mockMessageSequence,
  gotoWidgetReady,
  sendMessage,
} from '../fixtures/helpers.js';
import { ERROR_BODIES, SHORT_ANSWER } from '../fixtures/llm-scenarios.js';

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);
  });

  test('06-01: 500 Internal Server Error — error message shown', async ({ page }) => {
    await mockMessageError(
      page,
      ERROR_BODIES.INTERNAL_SERVER_ERROR.status,
      ERROR_BODIES.INTERNAL_SERVER_ERROR.body,
    );
    await gotoWidgetReady(page);
    await sendMessage(page, 'test');

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
  });

  test('06-02: 500 LLM empty response (Claude refusal → backend 500) — error shown', async ({
    page,
  }) => {
    await mockMessageError(
      page,
      ERROR_BODIES.LLM_EMPTY_RESPONSE.status,
      ERROR_BODIES.LLM_EMPTY_RESPONSE.body,
    );
    await gotoWidgetReady(page);
    await sendMessage(page, 'edge case query');

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
  });

  test('06-03: 503 Service Unavailable — error message shown', async ({ page }) => {
    await mockMessageError(
      page,
      ERROR_BODIES.SERVICE_UNAVAILABLE.status,
      ERROR_BODIES.SERVICE_UNAVAILABLE.body,
    );
    await gotoWidgetReady(page);
    await sendMessage(page, 'test');

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
  });

  test('06-04: Anthropic overloaded (529 → 503) — error shown', async ({ page }) => {
    await mockMessageError(
      page,
      ERROR_BODIES.ANTHROPIC_OVERLOADED.status,
      ERROR_BODIES.ANTHROPIC_OVERLOADED.body,
    );
    await gotoWidgetReady(page);
    await sendMessage(page, 'test');

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
  });

  test('06-05: network abort — error message shown', async ({ page }) => {
    await mockMessageAbort(page);
    await gotoWidgetReady(page);
    await sendMessage(page, 'test');

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
  });

  test('06-06: non-JSON response body — error message shown', async ({ page }) => {
    await page.route('**/chat/messages', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>Service error</body></html>',
      }),
    );
    await gotoWidgetReady(page);
    await sendMessage(page, 'test');

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
  });

  test('06-07: error state cleared on next successful send', async ({ page }) => {
    await mockMessageSequence(page, [
      { status: 500, body: ERROR_BODIES.INTERNAL_SERVER_ERROR.body },
      { status: 200, body: SHORT_ANSWER },
    ]);
    await gotoWidgetReady(page);

    // First fails
    await sendMessage(page, 'first');
    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });

    // Second succeeds — error should be gone, response shown
    await sendMessage(page, 'second');
    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({
      timeout: 8000,
    });
    await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(0);
  });
});
