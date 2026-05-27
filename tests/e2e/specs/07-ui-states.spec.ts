/**
 * Category: UI States
 *
 * Tests loading indicator, input/button disabled states during request,
 * double-submit prevention, and typing dots animation.
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockSession,
  gotoWidgetReady,
  sendMessage,
  DEFAULT_MESSAGE_RESPONSE,
} from '../fixtures/helpers.js';
import { SHORT_ANSWER } from '../fixtures/llm-scenarios.js';

test.describe('UI States', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);
  });

  test('07-01: typing indicator shown while waiting for response', async ({ page }) => {
    // Delay the response so we can observe the loading state
    await page.route('**/chat/messages', async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SHORT_ANSWER),
      });
    });
    await gotoWidgetReady(page);

    // Submit message
    const input = page.locator('.nene-corpus-chat__input');
    await input.fill('loading test');
    await page.locator('.nene-corpus-chat__submit').click();

    // Typing dots (pending bubble) must be visible
    await expect(page.locator('.nene-corpus-chat__bubble--pending')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.nene-corpus-chat__typing-dots')).toBeVisible();

    // After response: pending bubble gone
    await expect(page.locator('.nene-corpus-chat__bubble--pending')).toHaveCount(0, {
      timeout: 6000,
    });
  });

  test('07-02: input disabled during request', async ({ page }) => {
    await page.route('**/chat/messages', async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SHORT_ANSWER),
      });
    });
    await gotoWidgetReady(page);

    const input = page.locator('.nene-corpus-chat__input');
    await input.fill('test');
    await page.locator('.nene-corpus-chat__submit').click();

    // Input must be disabled during the request
    await expect(input).toBeDisabled({ timeout: 2000 });

    // After response, input re-enabled
    await expect(input).toBeEnabled({ timeout: 6000 });
  });

  test('07-03: submit button disabled during request', async ({ page }) => {
    await page.route('**/chat/messages', async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SHORT_ANSWER),
      });
    });
    await gotoWidgetReady(page);

    const submit = page.locator('.nene-corpus-chat__submit');
    await page.locator('.nene-corpus-chat__input').fill('test');
    await submit.click();

    await expect(submit).toBeDisabled({ timeout: 2000 });
    await expect(submit).toBeEnabled({ timeout: 6000 });
  });

  test('07-04: double submit prevented — only one API call made', async ({ page }) => {
    let callCount = 0;
    await page.route('**/chat/messages', async (route) => {
      callCount++;
      await new Promise((r) => setTimeout(r, 400));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...SHORT_ANSWER, message_id: callCount }),
      });
    });
    await gotoWidgetReady(page);

    const input = page.locator('.nene-corpus-chat__input');
    const submit = page.locator('.nene-corpus-chat__submit');

    await input.fill('rapid click');
    // Click submit multiple times rapidly
    await submit.click();
    await submit.click({ force: true }); // second click while disabled
    await submit.click({ force: true });

    // Wait for response
    await expect(page.locator('.nene-corpus-chat__bubble--pending')).toHaveCount(0, {
      timeout: 6000,
    });

    // Should be exactly 1 call
    expect(callCount).toBe(1);
  });

  test('07-05: user message appears immediately, before response', async ({ page }) => {
    await page.route('**/chat/messages', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SHORT_ANSWER),
      });
    });
    await gotoWidgetReady(page);

    await page.locator('.nene-corpus-chat__input').fill('Optimistic UI test');
    await page.locator('.nene-corpus-chat__submit').click();

    // User bubble appears immediately (optimistic update)
    await expect(page.locator('.nene-corpus-chat__bubble--user')).toBeVisible({ timeout: 1000 });
    await expect(page.locator('.nene-corpus-chat__bubble--user')).toContainText('Optimistic UI test');
  });
});
