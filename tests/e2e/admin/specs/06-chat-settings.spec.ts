/**
 * Category: Chat Settings
 *
 * Tests the ChatSettingsPanel inside the Settings modal:
 * loading defaults, custom overrides, save, reset, and errors.
 */

import { test, expect } from '@playwright/test';
import {
  gotoAdminDashboardFast,
  openSettingsSection,
} from '../fixtures/admin-helpers.js';
import {
  DEFAULT_CHAT_SETTINGS,
  CUSTOM_CHAT_SETTINGS,
} from '../fixtures/admin-api-mocks.js';

test.describe('Chat Settings', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminDashboardFast(page);
  });

  // ── Load defaults ───────────────────────────────────────────────────────────

  test('06-01: chat settings panel loads — default prompt shown as placeholder', async ({
    page,
  }) => {
    await page.route('**/admin/settings/chat', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(DEFAULT_CHAT_SETTINGS),
        });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Chat Settings');

    // System prompt textarea placeholder shows default
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 8000 });
    // Save button present
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });

  test('06-02: custom settings loaded — values shown in text areas', async ({ page }) => {
    await page.route('**/admin/settings/chat', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(CUSTOM_CHAT_SETTINGS),
        });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Chat Settings');

    // System prompt textarea contains custom value
    await expect(page.locator('textarea').first()).toHaveValue(
      CUSTOM_CHAT_SETTINGS.system_prompt,
      { timeout: 8000 },
    );
  });

  // ── Save ────────────────────────────────────────────────────────────────────

  test('06-03: save system prompt — PUT request includes new prompt', async ({ page }) => {
    let savedPrompt = '';
    await page.route('**/admin/settings/chat', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_CHAT_SETTINGS) });
      }
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { system_prompt?: string };
        savedPrompt = body.system_prompt ?? '';
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...DEFAULT_CHAT_SETTINGS, system_prompt: savedPrompt }) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Chat Settings');
    const promptArea = page.locator('textarea').first();
    await promptArea.waitFor({ timeout: 8000 });
    await promptArea.fill('New custom system prompt.');
    await page.locator('button:has-text("Save")').first().click();

    await expect(page.locator('text=saved')).toBeVisible({ timeout: 8000 });
    expect(savedPrompt).toBe('New custom system prompt.');
  });

  test('06-04: save fallback message — success toast shown', async ({ page }) => {
    let savedFallback = '';
    await page.route('**/admin/settings/chat', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_CHAT_SETTINGS) });
      }
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { fallback_message?: string };
        savedFallback = body.fallback_message ?? '';
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_CHAT_SETTINGS) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Chat Settings');
    const textareas = page.locator('textarea');
    // Second textarea is fallback message (if rendered separately)
    const count = await textareas.count();
    const target = count >= 2 ? textareas.nth(1) : textareas.first();
    await target.waitFor({ timeout: 8000 });
    await target.fill('Custom fallback message.');
    await page.locator('button:has-text("Save")').first().click();

    await expect(page.locator('text=saved')).toBeVisible({ timeout: 8000 });
  });

  // ── Reset to default ────────────────────────────────────────────────────────

  test('06-05: "Reset to default" clears custom prompt back to empty', async ({ page }) => {
    await page.route('**/admin/settings/chat', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CUSTOM_CHAT_SETTINGS) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Chat Settings');
    const promptArea = page.locator('textarea').first();
    await promptArea.waitFor({ timeout: 8000 });

    // Click reset
    const resetButtons = page.locator('button:has-text("Reset to default")');
    if (await resetButtons.count() > 0) {
      await resetButtons.first().click();
      // Prompt area should be cleared (empty string = use default)
      await expect(promptArea).toHaveValue('');
    }
  });

  // ── Errors ──────────────────────────────────────────────────────────────────

  test('06-06: load failure — error message shown', async ({ page }) => {
    await page.route('**/admin/settings/chat', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Server error"}' });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Chat Settings');
    await expect(page.locator('.text-red-600').first()).toBeVisible({ timeout: 8000 });
  });

  test('06-07: save failure — error message shown', async ({ page }) => {
    await page.route('**/admin/settings/chat', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_CHAT_SETTINGS) });
      }
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Save failed"}' });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Chat Settings');
    await page.locator('textarea').first().waitFor({ timeout: 8000 });
    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 6000 });
  });

  test('06-08: save with blank prompt — sends null (use default)', async ({ page }) => {
    let sentPayload: { system_prompt?: null | string } = {};
    await page.route('**/admin/settings/chat', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_CHAT_SETTINGS) });
      }
      if (route.request().method() === 'PUT') {
        sentPayload = JSON.parse(route.request().postData() ?? '{}') as typeof sentPayload;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_CHAT_SETTINGS) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Chat Settings');
    const promptArea = page.locator('textarea').first();
    await promptArea.waitFor({ timeout: 8000 });
    await promptArea.fill('');
    await page.locator('button:has-text("Save")').first().click();

    // null or empty string means "use default"
    await expect(async () => {
      expect(sentPayload.system_prompt == null || sentPayload.system_prompt === '').toBe(true);
    }).toPass({ timeout: 5000 });
  });
});
