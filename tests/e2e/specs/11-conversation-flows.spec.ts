/**
 * Category: Conversation Flows (複合会話シナリオ)
 *
 * Multi-step tests that combine normal exchanges, errors, and edge cases
 * within a single conversation.  Each test maintains state across multiple
 * send→response cycles and asserts the overall conversation shape.
 *
 * Patterns covered:
 *  - 5-turn happy path (all succeed, all messages retained)
 *  - Error mid-conversation, then recovery
 *  - Rate-limit mid-conversation, then recovery
 *  - Citation then no-citation alternating
 *  - Multiple errors in a row, then finally success
 *  - 10-turn long conversation (scroll accumulates, no truncation)
 *  - Interleaved fast/slow responses preserve message order
 *  - Mixed Japanese/English multi-turn
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
  MEDIUM_ANSWER,
  JAPANESE_ANSWER,
  ANSWER_WITH_SINGLE_CITATION,
  ANSWER_WITH_MULTIPLE_CITATIONS,
  buildConversationSequence,
  makeTaggedResponse,
  ERROR_BODIES,
} from '../fixtures/llm-scenarios.js';

test.describe('Conversation Flows', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);
  });

  // ── Happy-path multi-turn ─────────────────────────────────────────────────

  test('11-01: 5-turn conversation — all responses retained in order', async ({ page }) => {
    await mockMessageSequence(
      page,
      buildConversationSequence(5).map((b) => ({ status: 200, body: b })),
    );
    await gotoWidgetReady(page);

    for (let i = 0; i < 5; i++) {
      await sendAndWait(page, `Question ${i + 1}`);
    }

    // All 5 user and 5 assistant bubbles must be present
    expect(await getUserBubbleCount(page)).toBe(5);
    expect(await getAssistantBubbleCount(page)).toBe(5);

    // Verify order: each assistant reply carries its sequence number
    for (let i = 0; i < 5; i++) {
      const text = await getAssistantTextAt(page, i);
      expect(text).toContain(`Turn ${i + 1}`);
    }
  });

  // ── Error mid-conversation ────────────────────────────────────────────────

  test('11-02: error on turn 3 of 5 — prior messages intact, recovery on turn 4', async ({
    page,
  }) => {
    await mockMessageSequence(page, [
      { status: 200, body: makeTaggedResponse('T1', 1) },
      { status: 200, body: makeTaggedResponse('T2', 2) },
      { status: 500, body: ERROR_BODIES.INTERNAL_SERVER_ERROR.body },
      { status: 200, body: makeTaggedResponse('T4', 4) },
      { status: 200, body: makeTaggedResponse('T5', 5) },
    ]);
    await gotoWidgetReady(page);

    // Turns 1–2: success
    await sendAndWait(page, 'First');
    await sendAndWait(page, 'Second');
    expect(await getAssistantBubbleCount(page)).toBe(2);

    // Turn 3: error
    await sendAndWaitForError(page, 'Third — will fail');
    // Messages 1 and 2 still in DOM
    expect(await getAssistantBubbleCount(page)).toBe(2);

    // Turn 4: recovery
    await sendAndWait(page, 'Fourth — recovery');
    await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(0);
    expect(await getAssistantBubbleCount(page)).toBe(3);

    // Turn 5: continue normally
    await sendAndWait(page, 'Fifth');
    expect(await getAssistantBubbleCount(page)).toBe(4);

    const lastText = await getAssistantTextAt(page, 3);
    expect(lastText).toContain('[T5]');
  });

  // ── Rate-limit mid-conversation ───────────────────────────────────────────

  test('11-03: 429 rate-limit on turn 2, continues on turns 3–4', async ({ page }) => {
    await mockMessageSequence(page, [
      { status: 200, body: makeTaggedResponse('A', 1) },
      { status: 429, body: ERROR_BODIES.RATE_LIMIT_SESSION_HOURLY.body },
      { status: 200, body: makeTaggedResponse('C', 3) },
      { status: 200, body: makeTaggedResponse('D', 4) },
    ]);
    await gotoWidgetReady(page);

    await sendAndWait(page, 'First — ok');
    expect(await getAssistantBubbleCount(page)).toBe(1);

    await sendAndWaitForError(page, 'Second — rate limited');
    expect(await getAssistantBubbleCount(page)).toBe(1);

    await sendAndWait(page, 'Third — recovery');
    await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(0);
    expect(await getAssistantBubbleCount(page)).toBe(2);

    await sendAndWait(page, 'Fourth — normal');
    expect(await getAssistantBubbleCount(page)).toBe(3);
  });

  // ── Citation-then-no-citation alternating ─────────────────────────────────

  test('11-04: alternating cited / uncited responses in same conversation', async ({ page }) => {
    await mockMessageSequence(page, [
      { status: 200, body: ANSWER_WITH_SINGLE_CITATION },   // has citations
      { status: 200, body: SHORT_ANSWER },                   // no citations
      { status: 200, body: ANSWER_WITH_MULTIPLE_CITATIONS }, // has citations
      { status: 200, body: SHORT_ANSWER },                   // no citations
    ]);
    await gotoWidgetReady(page);

    await sendAndWait(page, 'Q1');
    await sendAndWait(page, 'Q2');
    await sendAndWait(page, 'Q3');
    await sendAndWait(page, 'Q4');

    // Turn 1 and 3 have citations; 2 and 4 do not
    const citationLists = page.locator('.nene-corpus-chat__citations');
    await expect(citationLists).toHaveCount(2);

    // Single citation on turn 1, 3 citations on turn 3
    const citations = page.locator('.nene-corpus-chat__citation');
    await expect(citations).toHaveCount(4); // 1 + 3
  });

  // ── Multiple consecutive errors then success ──────────────────────────────

  test('11-05: 3 consecutive errors then success — error replaced each time', async ({ page }) => {
    await mockMessageSequence(page, [
      { status: 503, body: ERROR_BODIES.SERVICE_UNAVAILABLE.body },
      { status: 429, body: ERROR_BODIES.RATE_LIMIT_SESSION_HOURLY.body },
      { status: 500, body: ERROR_BODIES.INTERNAL_SERVER_ERROR.body },
      { status: 200, body: makeTaggedResponse('OK', 4) },
    ]);
    await gotoWidgetReady(page);

    // Error 1
    await sendAndWaitForError(page, 'attempt 1');
    const err1 = await page.locator('.nene-corpus-chat__error').innerText();
    expect(err1.length).toBeGreaterThan(0);

    // Error 2 — error region updated (not stacked)
    await sendAndWaitForError(page, 'attempt 2');
    await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(1); // still single error element

    // Error 3
    await sendAndWaitForError(page, 'attempt 3');
    await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(1);

    // Finally success
    await sendAndWait(page, 'attempt 4 — success');
    await expect(page.locator('.nene-corpus-chat__error')).toHaveCount(0);
    expect(await getAssistantBubbleCount(page)).toBe(1);
  });

  // ── 10-turn long conversation ─────────────────────────────────────────────

  test('11-06: 10-turn conversation — all messages preserved, no DOM corruption', async ({
    page,
  }) => {
    await mockMessageSequence(
      page,
      buildConversationSequence(10).map((b) => ({ status: 200, body: b })),
    );
    await gotoWidgetReady(page);

    for (let i = 0; i < 10; i++) {
      await sendAndWait(page, `Q${i + 1}`);
    }

    expect(await getUserBubbleCount(page)).toBe(10);
    expect(await getAssistantBubbleCount(page)).toBe(10);

    // All 10 distinct responses are present in order
    for (let i = 0; i < 10; i++) {
      const text = await getAssistantTextAt(page, i);
      expect(text).toContain(`Turn ${i + 1}`);
    }

    // Widget still functional after 10 turns
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled();
  });

  // ── Interleaved slow / fast responses ────────────────────────────────────

  test('11-07: slow→fast→slow response sequence — messages arrive in order', async ({
    page,
  }) => {
    await mockMessageDelayedSequence(page, [
      { status: 200, body: makeTaggedResponse('SLOW1', 1), delayMs: 400 },
      { status: 200, body: makeTaggedResponse('FAST2', 2), delayMs: 50 },
      { status: 200, body: makeTaggedResponse('SLOW3', 3), delayMs: 400 },
    ]);
    await gotoWidgetReady(page);

    // Send sequentially; sendAndWait ensures we don't send next until prior resolves
    await sendAndWait(page, 'First (slow)');
    await sendAndWait(page, 'Second (fast)');
    await sendAndWait(page, 'Third (slow)');

    expect(await getAssistantBubbleCount(page)).toBe(3);
    expect(await getAssistantTextAt(page, 0)).toContain('[SLOW1]');
    expect(await getAssistantTextAt(page, 1)).toContain('[FAST2]');
    expect(await getAssistantTextAt(page, 2)).toContain('[SLOW3]');
  });

  // ── Mixed-language conversation ───────────────────────────────────────────

  test('11-08: Japanese question → English answer → Japanese question → English answer', async ({
    page,
  }) => {
    await mockMessageSequence(page, [
      { status: 200, body: SHORT_ANSWER },
      { status: 200, body: MEDIUM_ANSWER },
    ]);
    await gotoWidgetReady(page);

    await sendAndWait(page, '営業時間を教えてください');
    await sendAndWait(page, '返品ポリシーはどうですか？');

    // User bubbles contain Japanese text
    await expect(page.locator('.nene-corpus-chat__bubble--user').nth(0)).toContainText(
      '営業時間を教えてください',
    );
    await expect(page.locator('.nene-corpus-chat__bubble--user').nth(1)).toContainText(
      '返品ポリシーはどうですか？',
    );

    // Responses are in English (from mock)
    expect(await getAssistantTextAt(page, 0)).toContain(SHORT_ANSWER.content);
    expect(await getAssistantTextAt(page, 1)).toContain(MEDIUM_ANSWER.content);
  });

  // ── Citation-heavy conversation ───────────────────────────────────────────

  test('11-09: 3 consecutive citation-heavy answers — total citation count correct', async ({
    page,
  }) => {
    const THREE_CITATIONS = {
      ...ANSWER_WITH_MULTIPLE_CITATIONS,
      message_id: 99,
    };
    await mockMessageSequence(page, [
      { status: 200, body: THREE_CITATIONS },
      { status: 200, body: THREE_CITATIONS },
      { status: 200, body: THREE_CITATIONS },
    ]);
    await gotoWidgetReady(page);

    await sendAndWait(page, 'payment options?');
    await sendAndWait(page, 'payment options again?');
    await sendAndWait(page, 'payment options third time?');

    // 3 responses × 3 citations each = 9 citation items
    await expect(page.locator('.nene-corpus-chat__citation')).toHaveCount(9);
  });

  // ── Error during session creation then successful reconnect ───────────────

  test('11-10: session fails then user reloads — fresh session succeeds', async ({ page }) => {
    // First load: session API fails
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Session creation failed.' }),
      }),
    );
    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('.nene-corpus-chat__input')).toBeDisabled();

    // Reload: now session succeeds
    await page.unroute('**/chat/sessions');
    await mockMessageSequence(page, [{ status: 200, body: SHORT_ANSWER }]);
    await page.route('**/chat/sessions', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session_id: 1, session_token: 'recovered-token' }),
      }),
    );
    await page.reload();
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 6000 });

    await sendAndWait(page, 'Post-recovery message');
    expect(await getAssistantBubbleCount(page)).toBe(1);
  });
});
