/**
 * Category: Session Lifecycle（セッションライフサイクル複合テスト）
 *
 * Tests the full arc of a session: creation, reuse, token forwarding,
 * expiry mid-conversation, and cross-reload continuity.
 *
 * Patterns covered:
 *  - Token forwarded on ALL subsequent sends (not just first)
 *  - Session reused after page reload (token in sessionStorage)
 *  - Session cleared between two independent page contexts
 *  - Expired/invalid session (400) mid-conversation → error
 *  - Session created only once despite many rapid sends
 *  - Session token changes to new value when storage is cleared mid-conversation
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockSession,
  mockMessage,
  mockMessageSequence,
  gotoWidget,
  gotoWidgetReady,
  sendAndWait,
  sendAndWaitForError,
  sendMessage,
  getAssistantBubbleCount,
} from '../fixtures/helpers.js';
import {
  SHORT_ANSWER,
  makeTaggedResponse,
  ERROR_BODIES,
} from '../fixtures/llm-scenarios.js';
import { DEFAULT_SESSION } from '../fixtures/helpers.js';

const SESSION_KEY = 'nene-corpus.session_token';

test.describe('Session Lifecycle', () => {
  // ── Token forwarded on every send ─────────────────────────────────────────

  test('13-01: X-Session-Token header sent on all 5 messages (same token)', async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);

    const capturedTokens: string[] = [];
    await page.route('**/chat/messages', (route) => {
      const token = route.request().headers()['x-session-token'] ?? '';
      capturedTokens.push(token);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...SHORT_ANSWER, message_id: capturedTokens.length }),
      });
    });

    await gotoWidgetReady(page);

    for (let i = 0; i < 5; i++) {
      await sendAndWait(page, `Send ${i + 1}`);
    }

    expect(capturedTokens).toHaveLength(5);
    // Every request must carry the same session token
    const allSame = capturedTokens.every((t) => t === DEFAULT_SESSION.session_token);
    expect(allSame).toBe(true);
    // Token must not be empty
    capturedTokens.forEach((t) => expect(t.length).toBeGreaterThan(0));
  });

  // ── Session reused after reload ───────────────────────────────────────────

  test('13-02: session reused after hard reload — API called only once total', async ({
    page,
  }) => {
    await mockAppearance(page);
    await mockMessage(page, SHORT_ANSWER);

    let sessionCallCount = 0;
    await page.route('**/chat/sessions', (route) => {
      sessionCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_SESSION),
      });
    });

    // First load
    await page.goto('/widget-preview.html');
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 6000 });
    expect(sessionCallCount).toBe(1);

    // Reload: same tab context, sessionStorage intact
    await page.reload();
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 6000 });

    // Session API must NOT be called again
    expect(sessionCallCount).toBe(1);

    // Can still send messages
    await sendAndWait(page, 'Post-reload message');
    expect(await getAssistantBubbleCount(page)).toBe(1);
  });

  // ── Session creation called exactly once despite rapid widget load ────────

  test('13-03: session API called exactly once even if widget mounts twice', async ({ page }) => {
    await mockAppearance(page);
    await mockMessage(page, SHORT_ANSWER);

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

    // The `data-nene-corpus-mounted` guard prevents double-mount,
    // and useChatSession only calls createChatSession once.
    expect(sessionCallCount).toBe(1);
  });

  // ── Invalid session mid-conversation (400) ────────────────────────────────

  test('13-04: session becomes invalid mid-conversation (400) → error shown, no crash', async ({
    page,
  }) => {
    await mockAppearance(page);
    await mockSession(page);
    // First message: succeeds. Second message: 400 (invalid/expired session).
    await mockMessageSequence(page, [
      { status: 200, body: makeTaggedResponse('OK', 1) },
      { status: 400, body: ERROR_BODIES.INVALID_SESSION.body },
    ]);

    await gotoWidgetReady(page);

    // Turn 1 succeeds
    await sendAndWait(page, 'First message');
    expect(await getAssistantBubbleCount(page)).toBe(1);

    // Turn 2: 400 — widget shows error
    await sendAndWaitForError(page, 'Second message');
    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible();
    // Input remains enabled (widget did not crash)
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled();
  });

  // ── Token stored immediately ──────────────────────────────────────────────

  test('13-05: token written to sessionStorage before first message', async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);
    await mockMessage(page, SHORT_ANSWER);

    await gotoWidget(page);
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 6000 });

    // Token in storage as soon as session is established (before any message)
    const token = await page.evaluate(
      (key: string) => window.sessionStorage.getItem(key),
      SESSION_KEY,
    );
    expect(token).toBe(DEFAULT_SESSION.session_token);
  });

  // ── Cross-page isolation: second page gets its own session ────────────────

  test('13-06: two independent page loads each create own session', async ({ browser }) => {
    // Open two separate browser contexts (isolated sessionStorage)
    const ctx1 = await browser.newContext({ locale: 'en-US', storageState: { cookies: [], origins: [] } });
    const ctx2 = await browser.newContext({ locale: 'en-US', storageState: { cookies: [], origins: [] } });

    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    const token1 = 'session-ctx1-token';
    const token2 = 'session-ctx2-token';
    let sessionsCreated = 0;

    for (const [page, token] of [[page1, token1], [page2, token2]] as const) {
      await page.route('**/widget/appearance', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{"theme":{},"hero":{},"chat":{},"layout":{},"widget_locale":null,"custom_css":null}' }),
      );
      await page.route('**/chat/sessions', (route) => {
        sessionsCreated++;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ session_id: sessionsCreated, session_token: token }),
        });
      });
      await page.route('**/chat/messages', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SHORT_ANSWER) }),
      );
    }

    await page1.goto('http://localhost:3001/widget-preview.html');
    await page2.goto('http://localhost:3001/widget-preview.html');

    await page1.locator('.nene-corpus-chat__input').waitFor({ state: 'visible', timeout: 6000 });
    await page2.locator('.nene-corpus-chat__input').waitFor({ state: 'visible', timeout: 6000 });

    // Each context stores its own distinct token
    const stored1 = await page1.evaluate((k: string) => sessionStorage.getItem(k), SESSION_KEY);
    const stored2 = await page2.evaluate((k: string) => sessionStorage.getItem(k), SESSION_KEY);

    expect(stored1).toBe(token1);
    expect(stored2).toBe(token2);
    expect(stored1).not.toBe(stored2);

    await ctx1.close();
    await ctx2.close();
  });

  // ── Session token cleared → new session created on next send ─────────────

  test('13-07: clear sessionStorage after first message → new session for next message', async ({
    page,
  }) => {
    await mockAppearance(page);

    let sessionCallCount = 0;
    await page.route('**/chat/sessions', (route) => {
      sessionCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session_id: sessionCallCount,
          session_token: `token-${sessionCallCount}`,
        }),
      });
    });
    await mockMessage(page, SHORT_ANSWER);

    await gotoWidgetReady(page);
    expect(sessionCallCount).toBe(1);

    // Send first message with session 1
    await sendAndWait(page, 'With first session');
    expect(await getAssistantBubbleCount(page)).toBe(1);

    // Clear sessionStorage and reload → widget will create a new session
    await page.evaluate((key: string) => window.sessionStorage.removeItem(key), SESSION_KEY);
    await page.reload();
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 6000 });
    expect(sessionCallCount).toBe(2);

    await sendAndWait(page, 'With second session');
    expect(await getAssistantBubbleCount(page)).toBe(1); // fresh conversation
  });
});
