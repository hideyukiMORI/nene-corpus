/**
 * Category: Deep-link routing
 *
 * Verifies that navigating directly to any Admin SPA URL (e.g. /admin/sources,
 * /admin/analytics) renders the correct page without a 401 redirect or blank screen.
 *
 * Background:
 *   PR #304 added deep-link route support; PR #305 fixed .htaccess disambiguation
 *   so browsers landing on /admin/sources are served index.html (not routed to the
 *   PHP API). These tests guard against regression.
 *
 * Test strategy:
 *   - page.route() mocks intercept all API calls — no real backend required.
 *   - bypassLogin() injects the JWT token directly into sessionStorage.
 *   - page.goto() navigates to the deep-link URL; Playwright's browser context
 *     hits the Vite dev-server (Tier B local) where the SPA handles SPA fallback.
 *   - Each test asserts on a page-unique heading or sidebar active state.
 */

import { test, expect } from '@playwright/test';
import {
  ADMIN_URL,
  bypassLogin,
  mockAdminAuth,
  mockDashboardDefaults,
} from '../fixtures/admin-helpers.js';
import {
  SOURCE_LIST_EMPTY,
  SESSION_LIST_EMPTY,
} from '../fixtures/admin-api-mocks.js';

// ── Shared mock data ──────────────────────────────────────────────────────────

const ANALYTICS_SUMMARY = {
  total_sessions: 12,
  total_messages: 34,
  sessions_with_citations: 8,
  avg_messages_per_session: 2.8,
  range_days: 7,
  daily_sessions: [],
};

const TOP_QUESTIONS = { questions: [] };

// ── Shared setup ──────────────────────────────────────────────────────────────

/**
 * Mock every common endpoint so any page that fetches on mount
 * gets a 200 instead of a network error that might block rendering.
 */
async function setupDeepLinkMocks(page: import('@playwright/test').Page) {
  await bypassLogin(page);
  await mockAdminAuth(page);
  await mockDashboardDefaults(page);

  // analytics endpoints (DashboardPage + AnalyticsPage)
  await page.route('**/admin/analytics/summary**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ANALYTICS_SUMMARY),
    }),
  );
  await page.route('**/admin/analytics/top-questions**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TOP_QUESTIONS),
    }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Deep-link routing', () => {
  // ── Dashboard ───────────────────────────────────────────────────────────────

  test('17-01: /admin/dashboard renders DashboardPage', async ({ page }) => {
    await setupDeepLinkMocks(page);
    await page.goto(ADMIN_URL + 'dashboard');
    await expect(page.locator('h1:has-text("ダッシュボード")')).toBeVisible({ timeout: 8000 });
  });

  // ── Sources ─────────────────────────────────────────────────────────────────

  test('17-02: /admin/sources renders SourcesPage', async ({ page }) => {
    await setupDeepLinkMocks(page);
    await page.goto(ADMIN_URL + 'sources');
    // Sidebar nav item for "ソース" becomes active
    await expect(
      page.locator('.nav-item.active:has-text("ソース")'),
    ).toBeVisible({ timeout: 8000 });
  });

  // ── Conversations ───────────────────────────────────────────────────────────

  test('17-03: /admin/conversations renders ConversationsPage', async ({ page }) => {
    await setupDeepLinkMocks(page);
    await page.goto(ADMIN_URL + 'conversations');
    await expect(
      page.locator('.nav-item.active:has-text("会話ログ")'),
    ).toBeVisible({ timeout: 8000 });
  });

  // ── Analytics ───────────────────────────────────────────────────────────────

  test('17-04: /admin/analytics renders AnalyticsPage', async ({ page }) => {
    await setupDeepLinkMocks(page);
    await page.goto(ADMIN_URL + 'analytics');
    await expect(page.locator('h1:has-text("分析")')).toBeVisible({ timeout: 8000 });
  });

  // ── Help ────────────────────────────────────────────────────────────────────

  test('17-05: /admin/help renders HelpPage', async ({ page }) => {
    await setupDeepLinkMocks(page);
    await page.goto(ADMIN_URL + 'help');
    await expect(page.locator('h1:has-text("ヘルプ")')).toBeVisible({ timeout: 8000 });
  });

  // ── Settings ────────────────────────────────────────────────────────────────

  test('17-06: /admin/settings renders SettingsPage', async ({ page }) => {
    await setupDeepLinkMocks(page);
    await page.goto(ADMIN_URL + 'settings');
    await expect(
      page.locator('.nav-item.active:has-text("設定")'),
    ).toBeVisible({ timeout: 8000 });
  });

  test('17-07: /admin/settings/llm renders SettingsPage (LLM sub-route)', async ({ page }) => {
    await setupDeepLinkMocks(page);
    await page.route('**/admin/settings/llm', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            configured: true,
            api_key_masked: 'sk-ant-***',
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
          }),
        });
      }
      return route.continue();
    });
    await page.goto(ADMIN_URL + 'settings/llm');
    await expect(
      page.locator('.nav-item.active:has-text("設定")'),
    ).toBeVisible({ timeout: 8000 });
  });

  // ── Unauthenticated deep-link ────────────────────────────────────────────────

  test('17-08: unauthenticated deep-link redirects to LoginPage', async ({ page }) => {
    // No bypassLogin — token absent
    await mockAdminAuth(page);
    await page.goto(ADMIN_URL + 'sources');
    // SPA redirects unauthenticated users to /login — login form must appear
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 8000 });
  });

  // ── Browser back navigation ──────────────────────────────────────────────────

  test('17-09: browser back restores previous route via popstate', async ({ page }) => {
    await setupDeepLinkMocks(page);

    // Start at sources
    await page.goto(ADMIN_URL + 'sources');
    await expect(page.locator('.nav-item.active:has-text("ソース")')).toBeVisible({ timeout: 8000 });

    // Navigate to analytics via SPA (pushState)
    await page.locator('.nav-item:has-text("分析")').click();
    await expect(page.locator('h1:has-text("分析")')).toBeVisible({ timeout: 6000 });

    // Go back — should restore sources
    await page.goBack();
    await expect(page.locator('.nav-item.active:has-text("ソース")')).toBeVisible({ timeout: 6000 });
  });
});
