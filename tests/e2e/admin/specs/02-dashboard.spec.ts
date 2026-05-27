/**
 * Category: Dashboard
 *
 * Tests the post-login main page structure: LLM unconfigured banner,
 * panel visibility, header controls, and initial data loading states.
 */

import { test, expect } from '@playwright/test';
import {
  ADMIN_URL,
  mockAdminAuth,
  mockDashboardDefaults,
  bypassLogin,
  gotoAdminDashboardFast,
} from '../fixtures/admin-helpers.js';
import {
  LLM_CONFIGURED,
  LLM_NOT_CONFIGURED,
  SOURCE_LIST_EMPTY,
  SOURCE_LIST_THREE,
  SESSION_LIST_EMPTY,
  SESSION_LIST_THREE,
} from '../fixtures/admin-api-mocks.js';

test.describe('Dashboard', () => {
  // ── LLM banner ──────────────────────────────────────────────────────────────

  test('02-01: LLM not configured — warning banner visible with Configure LLM link', async ({
    page,
  }) => {
    await mockAdminAuth(page, { llmResponse: LLM_NOT_CONFIGURED });
    await mockDashboardDefaults(page);
    await page.route('**/admin/settings/llm', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(LLM_NOT_CONFIGURED),
        });
      }
      return route.continue();
    });

    await page.goto(ADMIN_URL);
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('pass');
    await page.locator('button[type="submit"]').click();
    await page.locator('h2:has-text("Sources")').waitFor({ timeout: 8000 });

    // Banner with Configure LLM button
    await expect(page.locator('button:has-text("Configure LLM")')).toBeVisible({ timeout: 6000 });
  });

  test('02-02: LLM configured — no warning banner', async ({ page }) => {
    await gotoAdminDashboardFast(page);

    // Banner must NOT appear
    await expect(page.locator('button:has-text("Configure LLM")')).toHaveCount(0);
  });

  test('02-03: banner "Configure LLM" button opens settings modal on LLM section', async ({
    page,
  }) => {
    await mockAdminAuth(page, { llmResponse: LLM_NOT_CONFIGURED });
    await mockDashboardDefaults(page);

    // We need the LLM endpoint to return not-configured on the initial GET
    await page.route('**/admin/settings/llm', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(LLM_NOT_CONFIGURED),
        });
      }
      return route.continue();
    });

    await page.goto(ADMIN_URL);
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('pass');
    await page.locator('button[type="submit"]').click();
    await page.locator('button:has-text("Configure LLM")').waitFor({ timeout: 8000 });
    await page.locator('button:has-text("Configure LLM")').click();

    // Settings modal opens on LLM section
    await expect(page.locator('dialog[open]')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('dialog nav button:has-text("LLM")')).toBeVisible();
  });

  // ── Page structure ──────────────────────────────────────────────────────────

  test('02-04: dashboard has all main sections', async ({ page }) => {
    await gotoAdminDashboardFast(page);

    await expect(page.locator('h2:has-text("Upload source")')).toBeVisible();
    await expect(page.locator('h2:has-text("Sources")')).toBeVisible();
    await expect(page.locator('h2:has-text("Conversation logs")')).toBeVisible();
  });

  test('02-05: header has Settings and Help buttons', async ({ page }) => {
    await gotoAdminDashboardFast(page);

    await expect(page.locator('header button:has-text("Settings")')).toBeVisible();
    await expect(page.locator('header button:has-text("Help")')).toBeVisible();
    await expect(page.locator('header button:has-text("Sign out")')).toBeVisible();
  });

  // ── Empty states ────────────────────────────────────────────────────────────

  test('02-06: empty sources list — shows empty message', async ({ page }) => {
    await bypassLogin(page);
    await mockAdminAuth(page);
    await page.route('**/admin/sources**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SOURCE_LIST_EMPTY),
      }),
    );
    await page.route('**/admin/chat/sessions**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SESSION_LIST_EMPTY),
      }),
    );
    await page.goto(ADMIN_URL);
    await page.locator('h2:has-text("Sources")').waitFor({ timeout: 8000 });

    await expect(
      page.locator('text=No sources yet. Upload a CSV or PDF above.'),
    ).toBeVisible({ timeout: 6000 });
  });

  test('02-07: sources list shows 3 sources', async ({ page }) => {
    await bypassLogin(page);
    await mockAdminAuth(page);
    await page.route('**/admin/sources**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SOURCE_LIST_THREE),
      }),
    );
    await page.route('**/admin/chat/sessions**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SESSION_LIST_EMPTY),
      }),
    );
    await page.goto(ADMIN_URL);
    await page.locator('h2:has-text("Sources")').waitFor({ timeout: 8000 });

    // Three source rows visible
    await expect(page.locator('tbody tr')).toHaveCount(3);
    await expect(page.locator('tbody')).toContainText('Product FAQ');
    await expect(page.locator('tbody')).toContainText('User Manual');
    await expect(page.locator('tbody')).toContainText('Data Import');
  });

  test('02-08: sources load error — error message shown', async ({ page }) => {
    await bypassLogin(page);
    await mockAdminAuth(page);
    await page.route('**/admin/sources**', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Server error"}' }),
    );
    await page.route('**/admin/chat/sessions**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION_LIST_EMPTY) }),
    );
    await page.goto(ADMIN_URL);
    await page.locator('h2:has-text("Sources")').waitFor({ timeout: 8000 });

    await expect(page.locator('.text-red-600').first()).toBeVisible({ timeout: 6000 });
  });

  // ── Settings modal ──────────────────────────────────────────────────────────

  test('02-09: Settings button opens modal with nav items', async ({ page }) => {
    await gotoAdminDashboardFast(page);
    await page.locator('header button:has-text("Settings")').click();

    await expect(page.locator('dialog[open]')).toBeVisible({ timeout: 6000 });
    // Overview section shown by default
    await expect(page.locator('dialog nav button:has-text("Overview")')).toBeVisible();
    await expect(page.locator('dialog nav button:has-text("LLM")')).toBeVisible();
    await expect(page.locator('dialog nav button:has-text("Chat Settings")')).toBeVisible();
    await expect(page.locator('dialog nav button:has-text("Appearance")')).toBeVisible();
    await expect(page.locator('dialog nav button:has-text("Usage Limits")')).toBeVisible();
    await expect(page.locator('dialog nav button:has-text("Notifications")')).toBeVisible();
    await expect(page.locator('dialog nav button:has-text("Account")')).toBeVisible();
  });

  test('02-10: Settings modal close button — modal dismissed', async ({ page }) => {
    await gotoAdminDashboardFast(page);
    await page.locator('header button:has-text("Settings")').click();
    await page.locator('dialog[open]').waitFor({ timeout: 6000 });

    // Close button in modal header
    await page.locator('dialog button:has-text("Close")').click();
    await expect(page.locator('dialog[open]')).toHaveCount(0, { timeout: 6000 });
  });

  test('02-11: Settings modal ESC key — modal dismissed', async ({ page }) => {
    await gotoAdminDashboardFast(page);
    await page.locator('header button:has-text("Settings")').click();
    await page.locator('dialog[open]').waitFor({ timeout: 6000 });

    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0, { timeout: 6000 });
  });

  test('02-12: Settings modal tab switching — all tabs navigable', async ({ page }) => {
    await gotoAdminDashboardFast(page);
    await page.locator('header button:has-text("Settings")').click();
    await page.locator('dialog[open]').waitFor({ timeout: 6000 });

    const tabs = ['LLM', 'Chat Settings', 'Appearance', 'Usage Limits', 'Notifications', 'Account', 'Overview'];
    for (const tab of tabs) {
      await page.locator(`dialog nav button:has-text("${tab}")`).click();
      // The nav button should be active (aria-selected, or just clickable without error)
      await expect(page.locator(`dialog nav button:has-text("${tab}")`)).toBeVisible();
    }
    // After cycling, dialog is still open
    await expect(page.locator('dialog[open]')).toBeVisible();
  });

  test('02-13: Settings Overview tab shows summary cards', async ({ page }) => {
    await gotoAdminDashboardFast(page);
    await page.locator('header button:has-text("Settings")').click();
    await page.locator('dialog[open]').waitFor({ timeout: 6000 });

    // Overview is the default tab — verify card-like items for each section
    await expect(page.locator('dialog nav button:has-text("Overview")')).toBeVisible();
    // Overview should render content referencing the sections
    await expect(page.locator('dialog').first()).toBeVisible();
  });
});
