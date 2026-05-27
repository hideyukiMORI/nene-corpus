/**
 * Category: Rate Limiting (HTTP 429)
 *
 * Covers all rate-limit scenarios the backend can return:
 * - Session hourly / interval limits
 * - IP hourly / daily limits
 * - Global daily limit
 * - Message-too-long (character limit)
 * - Token budget exhausted
 * - Recovery: next message succeeds after error
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockSession,
  mockMessageError,
  mockMessageSequence,
  gotoWidgetReady,
  sendMessage,
} from '../fixtures/helpers.js';
import { ERROR_BODIES, SHORT_ANSWER } from '../fixtures/llm-scenarios.js';

test.describe('Rate Limiting', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);
  });

  test('05-01: 429 session hourly — error message shown', async ({ page }) => {
    await mockMessageError(
      page,
      ERROR_BODIES.RATE_LIMIT_SESSION_HOURLY.status,
      ERROR_BODIES.RATE_LIMIT_SESSION_HOURLY.body,
    );
    await gotoWidgetReady(page);
    await sendMessage(page, 'test message');

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
  });

  test('05-02: 429 message interval — error message shown', async ({ page }) => {
    await mockMessageError(
      page,
      ERROR_BODIES.RATE_LIMIT_SESSION_INTERVAL.status,
      ERROR_BODIES.RATE_LIMIT_SESSION_INTERVAL.body,
    );
    await gotoWidgetReady(page);
    await sendMessage(page, 'test message');

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
  });

  test('05-03: 429 IP hourly — error message shown', async ({ page }) => {
    await mockMessageError(
      page,
      ERROR_BODIES.RATE_LIMIT_IP_HOURLY.status,
      ERROR_BODIES.RATE_LIMIT_IP_HOURLY.body,
    );
    await gotoWidgetReady(page);
    await sendMessage(page, 'test message');

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
    const errorText = await page.locator('.nene-corpus-chat__error').innerText();
    expect(errorText).toBeTruthy();
  });

  test('05-04: 429 daily per IP — error message shown', async ({ page }) => {
    await mockMessageError(
      page,
      ERROR_BODIES.RATE_LIMIT_DAILY_IP.status,
      ERROR_BODIES.RATE_LIMIT_DAILY_IP.body,
    );
    await gotoWidgetReady(page);
    await sendMessage(page, 'test message');

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
  });

  test('05-05: 429 message too long — field error shown', async ({ page }) => {
    await mockMessageError(
      page,
      ERROR_BODIES.RATE_LIMIT_MESSAGE_TOO_LONG.status,
      ERROR_BODIES.RATE_LIMIT_MESSAGE_TOO_LONG.body,
    );
    await gotoWidgetReady(page);
    await sendMessage(page, 'a'.repeat(500));

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
    const errorText = await page.locator('.nene-corpus-chat__error').innerText();
    // fetchJson formats field errors as "field: message"
    expect(errorText).toContain('content');
  });

  test('05-06: 429 token budget exhausted — error shown', async ({ page }) => {
    await mockMessageError(
      page,
      ERROR_BODIES.RATE_LIMIT_TOKEN_BUDGET.status,
      ERROR_BODIES.RATE_LIMIT_TOKEN_BUDGET.body,
    );
    await gotoWidgetReady(page);
    await sendMessage(page, 'test message');

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });
  });

  test('05-07: recovery — next message succeeds after 429', async ({ page }) => {
    // First call: 429; second call: 200
    await mockMessageSequence(page, [
      { status: 429, body: ERROR_BODIES.RATE_LIMIT_SESSION_HOURLY.body },
      { status: 200, body: SHORT_ANSWER },
    ]);
    await gotoWidgetReady(page);

    // First message fails
    await sendMessage(page, 'first');
    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 8000 });

    // Second message succeeds — error cleared, response shown
    await sendMessage(page, 'second');
    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({
      timeout: 8000,
    });
  });
});
