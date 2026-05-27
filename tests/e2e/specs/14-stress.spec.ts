/**
 * Category: Stress / High-Volume（大量・負荷シミュレーション）
 *
 * Tests the widget's stability under high message volumes, large response
 * payloads, and rapid user interactions.  All API responses are still mocked
 * (no real backend), so "stress" here means DOM/state management stress, not
 * network load.
 *
 * Patterns covered:
 *  - 20 sequential messages — DOM integrity and count accuracy
 *  - Very large response body (5 000+ chars) — no render crash
 *  - 5 citations × 5 messages — 25 citation items rendered correctly
 *  - Rapid user input (keyboard mashing) before session ready — no hang
 *  - Very long user input string (1 000 chars) — renders safely
 *  - 10 consecutive errors — widget never freezes
 *  - Mix of large/small responses — consistent layout
 *  - Extremely fast typing and clearing before submit
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockSession,
  mockMessage,
  mockMessageSequence,
  mockMessageDelayedSequence,
  gotoWidgetReady,
  sendAndWait,
  sendAndWaitForError,
  sendMessage,
  getUserBubbleCount,
  getAssistantBubbleCount,
  getAssistantTextAt,
} from '../fixtures/helpers.js';
import {
  SHORT_ANSWER,
  MEDIUM_ANSWER,
  STRESS_LARGE_RESPONSE,
  ANSWER_WITH_FIVE_CITATIONS,
  makeTaggedResponse,
  buildConversationSequence,
  ERROR_BODIES,
} from '../fixtures/llm-scenarios.js';

test.describe('Stress / High-Volume', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);
  });

  // ── 20-message sequential stress ─────────────────────────────────────────

  test('14-01: 20 sequential messages — DOM count exact, no corruption', async ({ page }) => {
    const N = 20;
    let seq = 0;
    await page.route('**/chat/messages', (route) => {
      seq++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...SHORT_ANSWER, message_id: seq }),
      });
    });
    await gotoWidgetReady(page);

    for (let i = 0; i < N; i++) {
      await sendAndWait(page, `Load message ${i + 1}`);
    }

    expect(await getUserBubbleCount(page)).toBe(N);
    expect(await getAssistantBubbleCount(page)).toBe(N);
    expect(seq).toBe(N);

    // Widget still functional
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled();
    await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(0);
  });

  // ── Very large response rendering ─────────────────────────────────────────

  test('14-02: very large response (5000+ chars) renders without crash', async ({ page }) => {
    await mockMessage(page, STRESS_LARGE_RESPONSE);
    await gotoWidgetReady(page);

    await sendAndWait(page, 'Give me everything');

    const bubble = page.locator('.nene-corpus-chat__bubble--assistant .nene-corpus-chat__bubble-text');
    await expect(bubble).toBeVisible({ timeout: 8000 });
    const text = await bubble.innerText();
    expect(text.length).toBeGreaterThan(2000);

    // Widget must remain interactive
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled();
  });

  test('14-03: three consecutive very large responses — no layout freeze', async ({ page }) => {
    await mockMessageSequence(page, [
      { status: 200, body: STRESS_LARGE_RESPONSE },
      { status: 200, body: STRESS_LARGE_RESPONSE },
      { status: 200, body: STRESS_LARGE_RESPONSE },
    ]);
    await gotoWidgetReady(page);

    await sendAndWait(page, 'Large 1');
    await sendAndWait(page, 'Large 2');
    await sendAndWait(page, 'Large 3');

    expect(await getAssistantBubbleCount(page)).toBe(3);
    // Input still enabled — widget not frozen
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled();
  });

  // ── Many citations ────────────────────────────────────────────────────────

  test('14-04: 5 citations × 5 messages = 25 citation items all rendered', async ({ page }) => {
    await mockMessageSequence(page, Array.from({ length: 5 }, () => ({
      status: 200,
      body: ANSWER_WITH_FIVE_CITATIONS,
    })));
    await gotoWidgetReady(page);

    for (let i = 0; i < 5; i++) {
      await sendAndWait(page, `Cited question ${i + 1}`);
    }

    // 5 responses × 5 citations = 25
    await expect(page.locator('.nene-corpus-chat__citation')).toHaveCount(25);
    // Every citation list present (5)
    await expect(page.locator('.nene-corpus-chat__citations')).toHaveCount(5);
    // Page-number metas: 5 msgs × 3 even-indexed citations with page = 15
    await expect(page.locator('.nene-corpus-chat__citation-meta')).toHaveCount(15);
  });

  // ── Very long user input ──────────────────────────────────────────────────

  test('14-05: 1000-character user message — renders safely in bubble', async ({ page }) => {
    await mockMessage(page, SHORT_ANSWER);
    await gotoWidgetReady(page);

    const longMessage = 'A'.repeat(500) + 'B'.repeat(500);
    await sendAndWait(page, longMessage);

    const userBubble = page.locator('.nene-corpus-chat__bubble--user .nene-corpus-chat__bubble-text');
    const text = await userBubble.innerText();
    expect(text.length).toBe(1000);
    expect(text.startsWith('AAAA')).toBe(true);
    expect(text.endsWith('BBBB')).toBe(true);

    // Widget still healthy after large user input
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled();
  });

  // ── 10 consecutive errors ─────────────────────────────────────────────────

  test('14-06: 10 consecutive 500 errors — widget never freezes, input stays enabled', async ({
    page,
  }) => {
    await mockMessageSequence(
      page,
      Array.from({ length: 10 }, () => ({
        status: 500,
        body: ERROR_BODIES.INTERNAL_SERVER_ERROR.body,
      })),
    );
    await gotoWidgetReady(page);

    for (let i = 0; i < 10; i++) {
      await sendAndWaitForError(page, `Error trigger ${i + 1}`);
      // Single error element, not accumulated
      await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(1);
      // Input re-enabled after each error
      await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled();
    }
  });

  // ── Alternating large/small responses ────────────────────────────────────

  test('14-07: alternating large/small responses × 6 — consistent bubble layout', async ({
    page,
  }) => {
    await mockMessageSequence(page, Array.from({ length: 6 }, (_, i) => ({
      status: 200,
      body: i % 2 === 0 ? STRESS_LARGE_RESPONSE : SHORT_ANSWER,
    })));
    await gotoWidgetReady(page);

    for (let i = 0; i < 6; i++) {
      await sendAndWait(page, `Q${i + 1}`);
    }

    expect(await getAssistantBubbleCount(page)).toBe(6);

    // Odd bubbles (0,2,4) are large; verify at least 3 have long text
    const largeCount = await (async () => {
      let count = 0;
      for (let i = 0; i < 6; i += 2) {
        const text = await getAssistantTextAt(page, i);
        if (text.length > 500) count++;
      }
      return count;
    })();
    expect(largeCount).toBe(3);
  });

  // ── Rapid type-clear-type before submit ───────────────────────────────────

  test('14-08: rapid type → clear → type → submit cycle × 5 — correct messages sent', async ({
    page,
  }) => {
    const sentTexts: string[] = [];
    await page.route('**/chat/messages', async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}') as { content?: string };
      sentTexts.push(body.content ?? '');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...SHORT_ANSWER, message_id: sentTexts.length }),
      });
    });
    await gotoWidgetReady(page);

    const input = page.locator('.nene-corpus-chat__input');
    const submit = page.locator('.nene-corpus-chat__submit');

    for (let i = 0; i < 5; i++) {
      // Type noise, clear, type real message, submit
      await input.fill('noise noise noise');
      await input.fill(''); // clear
      await input.fill(`Real message ${i + 1}`);
      await submit.click();

      // Wait for response
      await page.locator('.nene-corpus-chat__bubble--assistant').nth(i).waitFor({
        timeout: 8000,
      });
    }

    expect(sentTexts).toHaveLength(5);
    sentTexts.forEach((text, i) => {
      expect(text).toBe(`Real message ${i + 1}`);
    });
  });

  // ── Session creation never called twice under rapid widget interaction ─────

  test('14-09: hammering the widget before session ready — session created exactly once', async ({
    page,
  }) => {
    await mockAppearance(page);

    let sessionCallCount = 0;
    // Slow session response to allow interaction during loading
    await page.route('**/chat/sessions', async (route) => {
      await new Promise((r) => setTimeout(r, 300));
      sessionCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session_id: 1, session_token: 'only-one-token' }),
      });
    });
    await mockMessage(page, SHORT_ANSWER);

    await page.goto('/widget-preview.html');

    // Immediately try to type while session is loading (input is disabled — no-op)
    const input = page.locator('.nene-corpus-chat__input');
    // These fill calls will not send messages because input is disabled
    for (let i = 0; i < 5; i++) {
      await input.fill(`pre-session attempt ${i + 1}`).catch(() => {
        /* disabled inputs may throw */
      });
    }

    // Wait for session to be established
    await expect(input).toBeEnabled({ timeout: 6000 });

    // Session was created exactly once
    expect(sessionCallCount).toBe(1);
  });

  // ── Very long conversation (30 messages) — scroll and DOM stable ──────────

  test('14-10: 30 messages — final bubble is 30th, widget still responsive', async ({ page }) => {
    const N = 30;
    let seq = 0;
    await page.route('**/chat/messages', (route) => {
      seq++;
      const current = seq;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...SHORT_ANSWER,
          message_id: current,
          content: `Response number ${current}.`,
        }),
      });
    });
    await gotoWidgetReady(page);

    for (let i = 0; i < N; i++) {
      await sendAndWait(page, `Q${i + 1}`);
    }

    expect(await getUserBubbleCount(page)).toBe(N);
    expect(await getAssistantBubbleCount(page)).toBe(N);
    expect(seq).toBe(N);

    // Last bubble contains correct number
    const lastText = await getAssistantTextAt(page, N - 1);
    expect(lastText).toBe(`Response number ${N}.`);

    // Widget still accepting input
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled();
    await expect(page.locator('.nene-corpus-chat')).toBeVisible();
  });
});
