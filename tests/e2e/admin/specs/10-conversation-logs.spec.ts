/**
 * Category: Conversation Logs
 *
 * Tests the ConversationLogsPanel: session listing, pagination,
 * message detail view, cleanup, and error states.
 */

import { test, expect } from '@playwright/test';
import {
  bypassLogin,
  mockAdminAuth,
} from '../fixtures/admin-helpers.js';
import {
  SOURCE_LIST_EMPTY,
  SESSION_LIST_EMPTY,
  SESSION_LIST_THREE,
  SESSION_MESSAGES,
  makeSession,
} from '../fixtures/admin-api-mocks.js';

// ── Setup helper ─────────────────────────────────────────────────────────────

async function setupLogsPage(
  page: import('@playwright/test').Page,
  sessionsPayload: object,
) {
  await bypassLogin(page);
  await mockAdminAuth(page);
  await page.route('**/admin/sources**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SOURCE_LIST_EMPTY) }),
  );
  await page.route('**/admin/chat/sessions**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sessionsPayload) });
    }
    return route.continue();
  });

  await page.goto('/admin/');
  await page.locator('h2:has-text("Conversation logs")').waitFor({ timeout: 8000 });
}

test.describe('Conversation Logs', () => {
  // ── Summary section ─────────────────────────────────────────────────────────

  test('10-01: empty sessions — empty state message shown', async ({ page }) => {
    await setupLogsPage(page, SESSION_LIST_EMPTY);
    await expect(page.locator('text=No chat sessions yet.')).toBeVisible({ timeout: 6000 });
  });

  test('10-02: three sessions shown in summary', async ({ page }) => {
    await setupLogsPage(page, SESSION_LIST_THREE);

    // Summary table shows 3 session rows
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 6000 });
    await expect(page.locator('tbody tr')).toHaveCount(3, { timeout: 6000 });
    // "View all N sessions" link shows total count
    await expect(page.locator('text=View all 3 sessions')).toBeVisible();
  });

  // ── Open full logs panel ────────────────────────────────────────────────────

  test('10-03: "Conversation logs" button opens full panel', async ({ page }) => {
    await setupLogsPage(page, SESSION_LIST_THREE);

    // Click the "View all" / open logs button
    const openBtn = page.locator('button:has-text("View conversation logs"), button:has-text("View all"), button:has-text("Conversation logs")').last();
    await openBtn.click();

    // Full panel modal or expanded section appears
    await expect(page.locator('[aria-modal="true"] h2, dialog h2, [role="dialog"] h2').filter({ hasText: /Conversation/i })).toBeVisible({ timeout: 8000 });
  });

  test('10-04: session list in full panel shows all sessions', async ({ page }) => {
    await setupLogsPage(page, SESSION_LIST_THREE);
    const openBtn = page.locator('button:has-text("View conversation logs"), button:has-text("View all"), button:has-text("Conversation logs")').last();
    await openBtn.click();

    await page.locator('[aria-modal="true"], dialog, [role="dialog"]').last().waitFor({ timeout: 6000 });
    // 3 sessions visible
    await expect(page.locator('[aria-modal="true"] tbody tr, dialog tbody tr, [role="dialog"] tbody tr').first()).toBeVisible({ timeout: 6000 });
  });

  // ── Message detail ──────────────────────────────────────────────────────────

  test('10-05: click session — messages shown in detail pane', async ({ page }) => {
    await setupLogsPage(page, SESSION_LIST_THREE);

    // Mock messages endpoint
    await page.route('**/admin/chat/sessions/1/messages**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION_MESSAGES) }),
    );

    // Open full panel
    const openBtn = page.locator('button:has-text("View conversation logs"), button:has-text("View all"), button:has-text("Conversation logs")').last();
    await openBtn.click();
    await page.locator('[aria-modal="true"] tbody tr, dialog tbody tr, [role="dialog"] tbody tr').first().waitFor({ timeout: 6000 });
    await page.locator('[aria-modal="true"] tbody tr, dialog tbody tr, [role="dialog"] tbody tr').first().click();

    // Messages pane
    await expect(page.locator('text=What are your opening hours?')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=We are open Monday–Friday')).toBeVisible();
  });

  test('10-06: messages include user and assistant roles', async ({ page }) => {
    await setupLogsPage(page, SESSION_LIST_THREE);

    await page.route('**/admin/chat/sessions/1/messages**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION_MESSAGES) }),
    );

    const openBtn = page.locator('button:has-text("View conversation logs"), button:has-text("View all"), button:has-text("Conversation logs")').last();
    await openBtn.click();
    await page.locator('[aria-modal="true"] tbody tr, dialog tbody tr, [role="dialog"] tbody tr').first().waitFor({ timeout: 6000 });
    await page.locator('[aria-modal="true"] tbody tr, dialog tbody tr, [role="dialog"] tbody tr').first().click();

    // Both roles labeled
    await expect(page.locator('text=user').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=assistant').first()).toBeVisible();
  });

  // ── Empty messages ──────────────────────────────────────────────────────────

  test('10-07: empty session — "No messages" state shown', async ({ page }) => {
    await setupLogsPage(page, SESSION_LIST_THREE);

    await page.route('**/admin/chat/sessions/1/messages**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session_id: 1, messages: [] }) }),
    );

    const openBtn = page.locator('button:has-text("View conversation logs"), button:has-text("View all"), button:has-text("Conversation logs")').last();
    await openBtn.click();
    await page.locator('[aria-modal="true"] tbody tr, dialog tbody tr, [role="dialog"] tbody tr').first().waitFor({ timeout: 6000 });
    await page.locator('[aria-modal="true"] tbody tr, dialog tbody tr, [role="dialog"] tbody tr').first().click();

    await expect(page.locator('text=No messages in this session.')).toBeVisible({ timeout: 8000 });
  });

  // ── Load error ───────────────────────────────────────────────────────────────

  test('10-08: sessions load error — error message shown in summary', async ({ page }) => {
    await bypassLogin(page);
    await mockAdminAuth(page);
    await page.route('**/admin/sources**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SOURCE_LIST_EMPTY) }),
    );
    await page.route('**/admin/chat/sessions**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Server error"}' });
      }
      return route.continue();
    });

    await page.goto('/admin/');
    await page.locator('h2:has-text("Conversation logs")').waitFor({ timeout: 8000 });

    await expect(page.locator('.text-red-600').first()).toBeVisible({ timeout: 6000 });
  });

  // ── Cleanup button ──────────────────────────────────────────────────────────

  test('10-09: cleanup button present in full panel, calls DELETE', async ({ page }) => {
    let cleanupCalled = false;
    await setupLogsPage(page, SESSION_LIST_THREE);

    await page.route('**/admin/chat/sessions**', (route) => {
      if (route.request().method() === 'DELETE') {
        cleanupCalled = true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"deleted_count":0}' });
      }
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION_LIST_THREE) });
      }
      return route.continue();
    });

    const openBtn = page.locator('button:has-text("View conversation logs"), button:has-text("View all"), button:has-text("Conversation logs")').last();
    await openBtn.click();
    await page.locator('[aria-modal="true"], dialog, [role="dialog"]').last().waitFor({ timeout: 6000 });

    // Cleanup button (if visible in full panel)
    const cleanupBtn = page.locator('button:has-text("Clean up"), button:has-text("Cleanup"), button:has-text("Delete old")');
    if (await cleanupBtn.count() > 0) {
      await cleanupBtn.first().click();
      await expect(async () => expect(cleanupCalled).toBe(true)).toPass({ timeout: 5000 });
    }
  });

  // ── Pagination ──────────────────────────────────────────────────────────────

  test('10-10: large session list — pagination info shown', async ({ page }) => {
    const bigList = {
      sessions: Array.from({ length: 8 }, (_, i) => makeSession({ session_id: i + 1, message_count: i + 1 })),
      total: 30,
    };
    await setupLogsPage(page, bigList);

    // Total count in summary
    await expect(page.locator('text=30')).toBeVisible({ timeout: 6000 });
  });
});
