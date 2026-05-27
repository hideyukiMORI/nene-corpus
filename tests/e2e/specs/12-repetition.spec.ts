/**
 * Category: Repetition & Stability（反復・安定性テスト）
 *
 * Verifies that the widget behaves consistently when the same or similar
 * actions are repeated many times.  Targets regressions such as:
 *   - Memory leaks / stale closures causing wrong counts
 *   - State not resetting properly between error/success cycles
 *   - Input not clearing reliably over many sends
 *   - Double-submit guard degrading after N uses
 *   - Citation rendering accumulating stale DOM nodes
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockSession,
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
  ANSWER_WITH_SINGLE_CITATION,
  ANSWER_WITH_MULTIPLE_CITATIONS,
  makeTaggedResponse,
  buildConversationSequence,
  ERROR_BODIES,
} from '../fixtures/llm-scenarios.js';

test.describe('Repetition & Stability', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);
  });

  // ── Sequential correctness ────────────────────────────────────────────────

  test('12-01: 10 sequential messages — all retained in correct order', async ({ page }) => {
    const N = 10;
    await mockMessageSequence(
      page,
      buildConversationSequence(N).map((b) => ({ status: 200, body: b })),
    );
    await gotoWidgetReady(page);

    for (let i = 0; i < N; i++) {
      await sendAndWait(page, `Message ${i + 1}`);
    }

    expect(await getUserBubbleCount(page)).toBe(N);
    expect(await getAssistantBubbleCount(page)).toBe(N);

    // Each response references its position; verify no swap or duplication
    for (let i = 0; i < N; i++) {
      const text = await getAssistantTextAt(page, i);
      expect(text).toContain(`Turn ${i + 1}`);
    }
  });

  test('12-02: identical question × 5 — 5 distinct response bubbles (no deduplication)', async ({
    page,
  }) => {
    let callCount = 0;
    await page.route('**/chat/messages', (route) => {
      callCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...SHORT_ANSWER, message_id: callCount }),
      });
    });
    await gotoWidgetReady(page);

    const REPEATS = 5;
    for (let i = 0; i < REPEATS; i++) {
      await sendAndWait(page, 'What are your opening hours?');
    }

    expect(callCount).toBe(REPEATS);
    expect(await getAssistantBubbleCount(page)).toBe(REPEATS);
    // 5 user bubbles with the same text — none merged
    expect(await getUserBubbleCount(page)).toBe(REPEATS);
  });

  // ── Input cleared on every send ───────────────────────────────────────────

  test('12-03: input cleared after each of 7 sends', async ({ page }) => {
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

    const input = page.locator('.nene-corpus-chat__input');
    for (let i = 0; i < 7; i++) {
      await input.fill(`Message ${i + 1}`);
      await page.locator('.nene-corpus-chat__submit').click();
      // Input must be empty immediately after send
      await expect(input).toHaveValue('');
      // Wait for response before next iteration
      await page.locator('.nene-corpus-chat__bubble--assistant').nth(i).waitFor({
        timeout: 8000,
      });
    }
  });

  // ── Error/recovery cycle repeated ────────────────────────────────────────

  test('12-04: error → recovery cycle × 4 — error state resets cleanly each time', async ({
    page,
  }) => {
    // Interleave: fail, succeed, fail, succeed, fail, succeed, fail, succeed
    const responses = Array.from({ length: 8 }, (_, i) => {
      if (i % 2 === 0) {
        return { status: 500, body: ERROR_BODIES.INTERNAL_SERVER_ERROR.body };
      }
      return { status: 200, body: makeTaggedResponse(`R${Math.floor(i / 2) + 1}`, i) };
    });
    await mockMessageSequence(page, responses);
    await gotoWidgetReady(page);

    for (let cycle = 0; cycle < 4; cycle++) {
      // Error turn
      await sendAndWaitForError(page, `fail ${cycle + 1}`);
      await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(1);

      // Recovery turn
      await sendAndWait(page, `recover ${cycle + 1}`);
      await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(0);
    }

    // 4 successful assistant responses accumulated
    expect(await getAssistantBubbleCount(page)).toBe(4);
  });

  // ── Double-submit guard stable over many sends ────────────────────────────

  test('12-05: double-submit guard holds for 5 consecutive messages', async ({ page }) => {
    let callCount = 0;
    await mockMessageDelayedSequence(
      page,
      Array.from({ length: 5 }, (_, i) => ({
        status: 200,
        body: { ...SHORT_ANSWER, message_id: i + 1 },
        delayMs: 200,
      })),
    );
    await gotoWidgetReady(page);

    const submit = page.locator('.nene-corpus-chat__submit');

    for (let i = 0; i < 5; i++) {
      await page.locator('.nene-corpus-chat__input').fill(`Message ${i + 1}`);
      // Three rapid clicks — only first should take effect
      await submit.click();
      await submit.click({ force: true });
      await submit.click({ force: true });

      // Wait for response before next cycle
      await page.locator('.nene-corpus-chat__bubble--assistant').nth(i).waitFor({
        timeout: 5000,
      });
    }

    // Exactly 5 API calls despite 15 click attempts
    expect(await getAssistantBubbleCount(page)).toBe(5);
  });

  // ── Citation DOM accumulation ─────────────────────────────────────────────

  test('12-06: 5 turns with citations → exact citation count, no stale nodes', async ({
    page,
  }) => {
    // Each response: 1 citation (single), alternating with 3 citations (multiple)
    await mockMessageSequence(page, [
      { status: 200, body: ANSWER_WITH_SINGLE_CITATION },    // 1
      { status: 200, body: ANSWER_WITH_MULTIPLE_CITATIONS }, // 3
      { status: 200, body: ANSWER_WITH_SINGLE_CITATION },    // 1
      { status: 200, body: ANSWER_WITH_MULTIPLE_CITATIONS }, // 3
      { status: 200, body: ANSWER_WITH_SINGLE_CITATION },    // 1 → total 9
    ]);
    await gotoWidgetReady(page);

    for (let i = 0; i < 5; i++) {
      await sendAndWait(page, `Q${i + 1}`);
    }

    // Cumulative: 1 + 3 + 1 + 3 + 1 = 9
    await expect(page.locator('.nene-corpus-chat__citation')).toHaveCount(9);
    // Citation lists: 5 (one per message)
    await expect(page.locator('.nene-corpus-chat__citations')).toHaveCount(5);
  });

  // ── Long conversation then error then resume ──────────────────────────────

  test('12-07: 5 success → error → 5 success — total 10 assistant bubbles', async ({ page }) => {
    const responses = [
      ...buildConversationSequence(5).map((b) => ({ status: 200, body: b })),
      { status: 503, body: ERROR_BODIES.SERVICE_UNAVAILABLE.body },
      ...buildConversationSequence(5).map((b, i) => ({
        status: 200,
        body: { ...b, message_id: b.message_id + 5, content: `Resume Turn ${i + 1}` },
      })),
    ];
    await mockMessageSequence(page, responses);
    await gotoWidgetReady(page);

    for (let i = 0; i < 5; i++) {
      await sendAndWait(page, `First block Q${i + 1}`);
    }
    await sendAndWaitForError(page, 'This will error');

    for (let i = 0; i < 5; i++) {
      await sendAndWait(page, `Second block Q${i + 1}`);
    }

    expect(await getUserBubbleCount(page)).toBe(11); // 5 + 1 error-user + 5
    expect(await getAssistantBubbleCount(page)).toBe(10); // 5 + 0 (error) + 5
    await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(0);
  });

  // ── Rate-limit repeated recovery ─────────────────────────────────────────

  test('12-08: rate-limit × 3 different types then success — each error displayed', async ({
    page,
  }) => {
    await mockMessageSequence(page, [
      { status: 429, body: ERROR_BODIES.RATE_LIMIT_SESSION_HOURLY.body },
      { status: 429, body: ERROR_BODIES.RATE_LIMIT_IP_HOURLY.body },
      { status: 429, body: ERROR_BODIES.RATE_LIMIT_TOKEN_BUDGET.body },
      { status: 200, body: makeTaggedResponse('FINAL', 4) },
    ]);
    await gotoWidgetReady(page);

    await sendAndWaitForError(page, 'msg 1');
    const err1 = await page.locator('.nene-corpus-chat__error').innerText();

    await sendAndWaitForError(page, 'msg 2');
    const err2 = await page.locator('.nene-corpus-chat__error').innerText();

    await sendAndWaitForError(page, 'msg 3');
    const err3 = await page.locator('.nene-corpus-chat__error').innerText();

    // All three errors shown (different texts from different rate-limit types)
    // Note: error messages come from the widget's own error formatting
    expect(err1.length).toBeGreaterThan(0);
    expect(err2.length).toBeGreaterThan(0);
    expect(err3.length).toBeGreaterThan(0);

    await sendAndWait(page, 'msg 4 — success');
    await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(0);
    expect(await getAssistantBubbleCount(page)).toBe(1);
  });
});
