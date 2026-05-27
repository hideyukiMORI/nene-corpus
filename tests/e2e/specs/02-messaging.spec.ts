/**
 * Category: Message Input & Sending
 *
 * Tests input validation, submission via button and Enter key,
 * special character handling, and that messages appear in the chat.
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockSession,
  mockMessage,
  gotoWidgetReady,
  sendMessage,
  sendMessageEnter,
} from '../fixtures/helpers.js';
import { SHORT_ANSWER, JAPANESE_ANSWER } from '../fixtures/llm-scenarios.js';

test.describe('Message Input & Sending', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);
  });

  test('02-01: empty message does not call messages API', async ({ page }) => {
    let messageCalled = false;
    await page.route('**/chat/messages', (route) => {
      messageCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SHORT_ANSWER),
      });
    });
    await gotoWidgetReady(page);

    // Submit button is enabled once the session is ready (even with empty input).
    // Clicking it with an empty draft must silently no-op — no API call.
    await page.locator('.nene-corpus-chat__submit').click();
    expect(messageCalled).toBe(false);
  });

  test('02-02: whitespace-only message does not submit', async ({ page }) => {
    let messageCalled = false;
    await page.route('**/chat/messages', (route) => {
      messageCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SHORT_ANSWER),
      });
    });
    await gotoWidgetReady(page);

    const input = page.locator('.nene-corpus-chat__input');
    await input.fill('   ');
    await input.press('Enter');

    // API must not be called for whitespace
    expect(messageCalled).toBe(false);
  });

  test('02-03: normal message is sent and appears in chat', async ({ page }) => {
    await mockMessage(page, SHORT_ANSWER);
    await gotoWidgetReady(page);

    await sendMessage(page, 'What are your opening hours?');

    await expect(page.locator('.nene-corpus-chat__bubble--user')).toBeVisible();
    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({
      timeout: 8000,
    });
  });

  test('02-04: message sent via Enter key', async ({ page }) => {
    await mockMessage(page, SHORT_ANSWER);
    await gotoWidgetReady(page);

    await sendMessageEnter(page, 'Press Enter to send');

    await expect(page.locator('.nene-corpus-chat__bubble--user')).toBeVisible();
    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({
      timeout: 8000,
    });
  });

  test('02-05: input is cleared after message is sent', async ({ page }) => {
    await mockMessage(page, SHORT_ANSWER);
    await gotoWidgetReady(page);

    await sendMessage(page, 'Test message');

    // Input should be cleared immediately after submit
    await expect(page.locator('.nene-corpus-chat__input')).toHaveValue('');
  });

  test('02-06: Japanese text message sends correctly', async ({ page }) => {
    await mockMessage(page, JAPANESE_ANSWER);
    await gotoWidgetReady(page);

    await sendMessage(page, '営業時間を教えてください');

    await expect(page.locator('.nene-corpus-chat__bubble--user')).toContainText(
      '営業時間を教えてください',
    );
  });

  test('02-07: HTML special characters in message displayed safely', async ({ page }) => {
    await mockMessage(page, SHORT_ANSWER);
    await gotoWidgetReady(page);

    const dangerousInput = '<script>alert(1)</script>';
    await sendMessage(page, dangerousInput);

    // Must appear as plain text, not be executed
    const userBubble = page.locator('.nene-corpus-chat__bubble--user p');
    await expect(userBubble).toContainText('<script>');
    // Ensure no alert was triggered (page remains functional)
    await expect(page.locator('.nene-corpus-chat')).toBeVisible();
  });

  test('02-08: multiple messages accumulate in chat history', async ({ page }) => {
    let count = 0;
    await page.route('**/chat/messages', (route) => {
      count++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...SHORT_ANSWER, message_id: count }),
      });
    });
    await gotoWidgetReady(page);

    await sendMessage(page, 'First question');
    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toHaveCount(1, {
      timeout: 8000,
    });

    await sendMessage(page, 'Second question');
    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toHaveCount(2, {
      timeout: 8000,
    });
  });
});
