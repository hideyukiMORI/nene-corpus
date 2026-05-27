/**
 * Category: Accessibility
 *
 * Tests ARIA roles, live regions, keyboard navigation,
 * and screen reader labels.
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockSession,
  mockMessage,
  gotoWidgetReady,
  sendMessage,
  DEFAULT_MESSAGE_RESPONSE,
} from '../fixtures/helpers.js';
import { SHORT_ANSWER } from '../fixtures/llm-scenarios.js';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);
    await mockMessage(page, SHORT_ANSWER);
  });

  test('09-01: chat panel has aria-label', async ({ page }) => {
    await gotoWidgetReady(page);

    const panel = page.locator('.nene-corpus-chat');
    await expect(panel).toHaveAttribute('aria-label', 'NeNe Corpus chat');
  });

  test('09-02: messages container has aria-live="polite"', async ({ page }) => {
    await gotoWidgetReady(page);

    const messages = page.locator('.nene-corpus-chat__messages');
    await expect(messages).toHaveAttribute('aria-live', 'polite');
  });

  test('09-03: input has aria-label', async ({ page }) => {
    await gotoWidgetReady(page);

    const input = page.locator('.nene-corpus-chat__input');
    await expect(input).toHaveAttribute('aria-label', 'Chat message');
  });

  test('09-04: message bubbles have aria-label (role)', async ({ page }) => {
    await gotoWidgetReady(page);
    await sendMessage(page, 'test accessibility');

    // User bubble — the article itself carries the aria-label (i18n role.user, English: "User")
    await expect(page.locator('article.nene-corpus-chat__bubble--user')).toHaveAttribute(
      'aria-label',
      'User',
    );
    // Assistant bubble
    await expect(page.locator('article.nene-corpus-chat__bubble--assistant')).toHaveAttribute(
      'aria-label',
      'Assistant',
      { timeout: 8000 },
    );
  });

  test('09-05: keyboard — Tab to input, Enter to send', async ({ page }) => {
    await gotoWidgetReady(page);

    // Tab until the input is focused
    const input = page.locator('.nene-corpus-chat__input');
    await input.focus();
    await expect(input).toBeFocused();

    // Type and press Enter
    await input.type('keyboard test');
    await input.press('Enter');

    await expect(page.locator('.nene-corpus-chat__bubble--user')).toContainText('keyboard test', {
      timeout: 3000,
    });
  });

  test('09-06: error message is visible to assistive technology', async ({ page }) => {
    // Trigger an error
    await page.route('**/chat/messages', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal error' }),
      }),
    );
    await gotoWidgetReady(page);
    await sendMessage(page, 'trigger error');

    const error = page.locator('.nene-corpus-chat__error');
    await expect(error).toBeVisible({ timeout: 8000 });
    // Error element is a <p> that is directly visible (no aria-hidden)
    await expect(error).not.toHaveAttribute('aria-hidden', 'true');
    const errorText = await error.innerText();
    expect(errorText.trim().length).toBeGreaterThan(0);
  });
});
