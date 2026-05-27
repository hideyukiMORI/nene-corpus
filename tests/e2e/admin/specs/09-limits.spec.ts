/**
 * Category: Usage Limits
 *
 * Tests the ChatLimitsPanel: presets, custom field editing,
 * save success, and error states.
 */

import { test, expect } from '@playwright/test';
import {
  gotoAdminDashboardFast,
  openSettingsSection,
} from '../fixtures/admin-helpers.js';
import { DEFAULT_LIMITS } from '../fixtures/admin-api-mocks.js';

test.describe('Usage Limits', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminDashboardFast(page);
  });

  // ── Loading ─────────────────────────────────────────────────────────────────

  test('09-01: usage limits panel loads default values', async ({ page }) => {
    await page.route('**/admin/settings/limits', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_LIMITS) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Usage Limits');
    // Numeric fields visible
    await expect(page.locator('input[type="number"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('09-02: load failure — error message shown', async ({ page }) => {
    await page.route('**/admin/settings/limits', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Server error"}' });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Usage Limits');
    await expect(page.locator('.text-red-600').first()).toBeVisible({ timeout: 8000 });
  });

  // ── Preset buttons ──────────────────────────────────────────────────────────

  test('09-03: "Conservative" preset — fills fields with conservative values', async ({ page }) => {
    await page.route('**/admin/settings/limits', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_LIMITS) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Usage Limits');
    await page.locator('button:has-text("Conservative")').waitFor({ timeout: 8000 });
    await page.locator('button:has-text("Conservative")').click();

    // Conservative preset: max_message_chars = 300
    const charInput = page.locator('input[type="number"]').first();
    await expect(charInput).toHaveValue('300', { timeout: 4000 });
  });

  test('09-04: "Unlimited" preset — fills all fields with 0', async ({ page }) => {
    await page.route('**/admin/settings/limits', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_LIMITS) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Usage Limits');
    await page.locator('button:has-text("Unlimited")').waitFor({ timeout: 8000 });
    await page.locator('button:has-text("Unlimited")').click();

    // All numeric inputs should be 0
    const inputs = page.locator('input[type="number"]');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue('0', { timeout: 4000 });
    }
  });

  test('09-05: "Standard" preset — sets max_message_chars to 800', async ({ page }) => {
    await page.route('**/admin/settings/limits', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_LIMITS) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Usage Limits');
    await page.locator('button:has-text("Standard")').waitFor({ timeout: 8000 });
    await page.locator('button:has-text("Standard")').click();

    const charInput = page.locator('input[type="number"]').first();
    await expect(charInput).toHaveValue('800', { timeout: 4000 });
  });

  // ── Custom values ───────────────────────────────────────────────────────────

  test('09-06: edit max_message_chars field — PUT includes updated value', async ({ page }) => {
    let sentMaxChars = 0;

    await page.route('**/admin/settings/limits', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_LIMITS) });
      }
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { max_message_chars?: number };
        sentMaxChars = body.max_message_chars ?? 0;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...DEFAULT_LIMITS, max_message_chars: sentMaxChars }) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Usage Limits');
    const charInput = page.locator('input[type="number"]').first();
    await charInput.waitFor({ timeout: 8000 });
    await charInput.fill('500');
    await page.locator('button:has-text("Save")').first().click();

    await expect(page.locator('text=saved')).toBeVisible({ timeout: 8000 });
    expect(sentMaxChars).toBe(500);
  });

  test('09-07: all eight limit fields present', async ({ page }) => {
    await page.route('**/admin/settings/limits', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_LIMITS) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Usage Limits');
    await page.locator('input[type="number"]').first().waitFor({ timeout: 8000 });
    const count = await page.locator('input[type="number"]').count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  // ── Save / Error ────────────────────────────────────────────────────────────

  test('09-08: save failure — error message shown', async ({ page }) => {
    await page.route('**/admin/settings/limits', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_LIMITS) });
      }
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Server error"}' });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Usage Limits');
    await page.locator('button:has-text("Save")').first().waitFor({ timeout: 8000 });
    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 6000 });
  });
});
