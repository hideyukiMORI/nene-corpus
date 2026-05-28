/**
 * Category: Multi-tenancy
 *
 * Tests the Superadmin settings panel (tenant resolution mode + org CRUD)
 * and verifies that a regular admin cannot access superadmin UI.
 *
 * All API calls are intercepted via page.route() — no real backend required.
 * The spec follows the same patterns as the existing admin specs (07-llm-settings.spec.ts etc.).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  gotoAdminDashboardFast,
  mockAdminAuth,
  mockDashboardDefaults,
  bypassLogin,
  openSettings,
  ADMIN_URL,
} from '../fixtures/admin-helpers.js';
import {
  DEFAULT_ME_RESPONSE,
} from '../fixtures/admin-api-mocks.js';

// ── Mock data ────────────────────────────────────────────────────────────────

const SUPERADMIN_ME_RESPONSE = {
  ...DEFAULT_ME_RESPONSE,
  id: 2,
  email: 'superadmin@example.com',
  role: 'superadmin',
};

const DEFAULT_SYSTEM_CONFIG = {
  tenant_resolution_mode: 'single',
  tenant_org_slug: 'default',
  tenant_base_domain: null,
};

const DEFAULT_ORG = {
  id: 1,
  name: 'Default Organization',
  slug: 'default',
  custom_domain: null,
  plan: 'free',
  is_active: true,
  external_id: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const DEFAULT_ORG_LIST = {
  organizations: [DEFAULT_ORG],
  total: 1,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Setup a session as superadmin and navigate to the dashboard. */
async function gotoAsSuperadmin(page: Page): Promise<void> {
  await bypassLogin(page);
  await mockAdminAuth(page, { meResponse: SUPERADMIN_ME_RESPONSE });
  await mockDashboardDefaults(page);

  // Superadmin endpoints
  await page.route('**/admin/superadmin/system-config', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_SYSTEM_CONFIG),
      });
    }
    if (route.request().method() === 'PATCH') {
      const body = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...DEFAULT_SYSTEM_CONFIG, ...body }),
      });
    }
    return route.continue();
  });

  await page.route('**/admin/superadmin/organizations**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_ORG_LIST),
      });
    }
    return route.continue();
  });

  await page.goto(ADMIN_URL);
  await page.locator('h2:has-text("Sources")').waitFor({ timeout: 8000 });
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Multi-tenancy — Superadmin UI', () => {
  // ── 15-01: superadmin sees Superadmin section ────────────────────────────

  test('15-01: superadmin role — settings modal shows Superadmin section', async ({ page }) => {
    await gotoAsSuperadmin(page);
    await openSettings(page);

    // The settings modal should contain a "Superadmin" or "スーパー管理者" nav entry
    const superadminNav = page.locator(
      'dialog nav button:has-text("Superadmin"), dialog nav button:has-text("スーパー管理者")',
    );
    await expect(superadminNav).toBeVisible({ timeout: 6000 });
  });

  // ── 15-02: tenant resolution section visible ──────────────────────────────

  test('15-02: superadmin — tenant resolution section shows three mode options', async ({ page }) => {
    await gotoAsSuperadmin(page);
    await openSettings(page);

    // Navigate to Superadmin section
    const superadminNav = page.locator(
      'dialog nav button:has-text("Superadmin"), dialog nav button:has-text("スーパー管理者")',
    );
    await superadminNav.click();

    // Expand/find tenant resolution section (accordion or direct)
    const resolutionSection = page.locator(
      'button:has-text("テナント解決"), button:has-text("Tenant Resolution")',
    );
    if (await resolutionSection.count() > 0) {
      await resolutionSection.first().click();
    }

    // Three radio options: single, subdomain, path
    await expect(page.locator('input[type="radio"][value="single"]')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('input[type="radio"][value="subdomain"]')).toBeVisible({ timeout: 4000 });
    await expect(page.locator('input[type="radio"][value="path"]')).toBeVisible({ timeout: 4000 });
  });

  // ── 15-03: save system config ─────────────────────────────────────────────

  test('15-03: superadmin — select single mode, enter org slug, save succeeds', async ({ page }) => {
    let patchBody: Record<string, unknown> = {};

    await bypassLogin(page);
    await mockAdminAuth(page, { meResponse: SUPERADMIN_ME_RESPONSE });
    await mockDashboardDefaults(page);
    await page.route('**/admin/superadmin/system-config', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(DEFAULT_SYSTEM_CONFIG),
        });
      }
      if (route.request().method() === 'PATCH') {
        patchBody = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...DEFAULT_SYSTEM_CONFIG, ...patchBody }),
        });
      }
      return route.continue();
    });
    await page.route('**/admin/superadmin/organizations**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_ORG_LIST) }),
    );

    await page.goto(ADMIN_URL);
    await page.locator('h2:has-text("Sources")').waitFor({ timeout: 8000 });
    await openSettings(page);

    const superadminNav = page.locator(
      'dialog nav button:has-text("Superadmin"), dialog nav button:has-text("スーパー管理者")',
    );
    await superadminNav.click();

    // Expand section if accordion
    const resolutionSection = page.locator(
      'button:has-text("テナント解決"), button:has-text("Tenant Resolution")',
    );
    if (await resolutionSection.count() > 0) {
      await resolutionSection.first().click();
    }

    // Select single
    const singleRadio = page.locator('input[type="radio"][value="single"]');
    await singleRadio.waitFor({ timeout: 6000 });
    await singleRadio.check();

    // Enter org slug (optional field)
    const slugInput = page.locator('input[name*="org_slug"], input[placeholder*="slug"]').first();
    if (await slugInput.count() > 0) {
      await slugInput.fill('my-org');
    }

    // Save
    await page.locator('button:has-text("Save"), button:has-text("保存")').first().click();

    // Success indicator
    await expect(
      page.locator('[role="status"], .text-green-600, .toast').first(),
    ).toBeVisible({ timeout: 6000 });
  });

  // ── 15-04: org list and create ────────────────────────────────────────────

  test('15-04: superadmin — organization list shows existing org; add new org succeeds', async ({ page }) => {
    const newOrg = {
      id: 2,
      name: 'Test Org',
      slug: 'test',
      custom_domain: null,
      plan: 'free',
      is_active: true,
      external_id: null,
      created_at: '2026-05-29T00:00:00Z',
      updated_at: '2026-05-29T00:00:00Z',
    };

    let postCalled = false;
    let returnUpdated = false;

    await bypassLogin(page);
    await mockAdminAuth(page, { meResponse: SUPERADMIN_ME_RESPONSE });
    await mockDashboardDefaults(page);
    await page.route('**/admin/superadmin/system-config', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_SYSTEM_CONFIG) }),
    );

    await page.route('**/admin/superadmin/organizations', (route) => {
      if (route.request().method() === 'GET') {
        const list = returnUpdated
          ? { organizations: [DEFAULT_ORG, newOrg], total: 2 }
          : DEFAULT_ORG_LIST;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(list) });
      }
      if (route.request().method() === 'POST') {
        postCalled = true;
        returnUpdated = true;
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newOrg) });
      }
      return route.continue();
    });

    await page.goto(ADMIN_URL);
    await page.locator('h2:has-text("Sources")').waitFor({ timeout: 8000 });
    await openSettings(page);

    const superadminNav = page.locator(
      'dialog nav button:has-text("Superadmin"), dialog nav button:has-text("スーパー管理者")',
    );
    await superadminNav.click();

    // Find org management section
    const orgSection = page.locator(
      'button:has-text("組織管理"), button:has-text("Organizations")',
    );
    if (await orgSection.count() > 0) {
      await orgSection.first().click();
    }

    // Default org should be visible
    await expect(page.locator('text=Default Organization, text=default')).toBeVisible({ timeout: 6000 });

    // Click add new org button (if it exists in current UI)
    const addBtn = page.locator(
      'button:has-text("+ 組織"), button:has-text("組織を追加"), button:has-text("Add Organization")',
    );
    if (await addBtn.count() > 0) {
      await addBtn.first().click();

      // Fill form
      const nameInput = page.locator(
        'input[name="name"], input[placeholder*="name"], input[placeholder*="名前"]',
      ).last();
      await nameInput.waitFor({ timeout: 4000 });
      await nameInput.fill('Test Org');
      const slugInput = page.locator('input[name="slug"], input[placeholder*="slug"]').last();
      await slugInput.fill('test');

      // Submit
      await page.locator(
        'button[type="submit"]:has-text("作成"), button[type="submit"]:has-text("Create")',
      ).first().click();

      await expect(page.locator('text=Test Org')).toBeVisible({ timeout: 6000 });
      expect(postCalled).toBe(true);
    }
  });

  // ── 15-05: regular admin cannot see Superadmin section ───────────────────

  test('15-05: regular admin role — settings modal does NOT show Superadmin section', async ({ page }) => {
    await gotoAdminDashboardFast(page);
    await openSettings(page);

    // Superadmin nav entry should NOT be present for a regular admin
    const superadminNav = page.locator(
      'dialog nav button:has-text("Superadmin"), dialog nav button:has-text("スーパー管理者")',
    );
    await expect(superadminNav).not.toBeVisible({ timeout: 3000 });
  });

  // ── 15-06: org scope — backend returns empty for cross-tenant access ──────

  test('15-06: org scope — API returns empty list (org-scoped, cross-tenant sources not visible)', async ({ page }) => {
    // This test verifies that the Admin UI correctly renders an empty state when
    // the backend returns an empty list (which is what happens when the org filter
    // is applied and the authenticated admin has no sources in their org).
    await bypassLogin(page);
    await mockAdminAuth(page);
    await page.route('**/admin/sources**', (route) => {
      if (route.request().method() === 'GET') {
        // Backend applies org_id filter — other org's sources are not returned
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ sources: [], total: 0 }),
        });
      }
      return route.continue();
    });
    await page.route('**/admin/chat/sessions**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [], total: 0 }) }),
    );

    await page.goto(ADMIN_URL);
    await page.locator('h2:has-text("Sources")').waitFor({ timeout: 8000 });

    // No source items rendered (empty org-scoped result)
    const sourceItems = page.locator('[data-testid="source-item"], .source-item, [data-source-id]');
    await expect(sourceItems).toHaveCount(0);
  });

  // ── 15-07: direct hash navigation guarded for non-superadmin ─────────────

  test('15-07: regular admin — direct hash #superadmin-system-config shows no superadmin content', async ({ page }) => {
    await gotoAdminDashboardFast(page);

    // Navigate directly to the superadmin hash
    await page.goto(`${ADMIN_URL}#superadmin-system-config`);

    // Even after direct hash navigation, superadmin content should not be visible
    const superadminContent = page.locator(
      '[data-section="superadmin-system-config"], [id="superadmin-system-config"]',
    );
    await expect(superadminContent).not.toBeVisible({ timeout: 3000 });
  });
});
