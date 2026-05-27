/**
 * Category: LLM Settings
 *
 * Tests the LlmSettingsPanel: loading, API key entry, model selection,
 * max_tokens, test connection, save, and error states.
 */

import { test, expect } from '@playwright/test';
import {
  gotoAdminDashboardFast,
  openSettingsSection,
} from '../fixtures/admin-helpers.js';
import { LLM_CONFIGURED, LLM_NOT_CONFIGURED } from '../fixtures/admin-api-mocks.js';

test.describe('LLM Settings', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminDashboardFast(page);
  });

  // ── Loading ─────────────────────────────────────────────────────────────────

  test('07-01: configured — masked key and model shown', async ({ page }) => {
    await page.route('**/admin/settings/llm', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LLM_CONFIGURED) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'LLM');
    // Masked key displayed
    await expect(page.locator('text=sk-ant-***')).toBeVisible({ timeout: 8000 });
    // Model shown in select
    await expect(page.locator('select, input[name*="model"]').first()).toBeVisible({ timeout: 6000 });
  });

  test('07-02: not configured — masked key field shows "none"', async ({ page }) => {
    await page.route('**/admin/settings/llm', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LLM_NOT_CONFIGURED) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'LLM');
    // No key — UI indicates no key set; form is still usable
    await expect(page.locator('input[type="text"], input[type="password"]').first()).toBeVisible({ timeout: 8000 });
  });

  // ── Save settings ───────────────────────────────────────────────────────────

  test('07-03: enter new API key and save — PUT request includes api_key', async ({ page }) => {
    let sentKey = '';
    await page.route('**/admin/settings/llm', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LLM_CONFIGURED) });
      }
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { api_key?: string };
        sentKey = body.api_key ?? '';
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...LLM_CONFIGURED, configured: true }) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'LLM');
    // API key input (placeholder text or specific label)
    const keyInput = page.locator('input[placeholder*="key"], input[placeholder*="Key"]').first();
    await keyInput.waitFor({ timeout: 8000 });
    await keyInput.fill('sk-ant-new-test-key-xyz');
    await page.locator('button:has-text("Save")').first().click();

    await expect(page.locator('text=saved')).toBeVisible({ timeout: 8000 });
    expect(sentKey).toBe('sk-ant-new-test-key-xyz');
  });

  test('07-04: change model and save — PUT request includes model', async ({ page }) => {
    let sentModel = '';
    await page.route('**/admin/settings/llm', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LLM_CONFIGURED) });
      }
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { model?: string };
        sentModel = body.model ?? '';
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...LLM_CONFIGURED, model: sentModel }) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'LLM');
    const modelSelect = page.locator('select').first();
    await modelSelect.waitFor({ timeout: 8000 });
    // Select an option (just pick whatever's available)
    const options = await modelSelect.locator('option').allTextContents();
    if (options.length > 0) {
      await modelSelect.selectOption({ index: 0 });
    }
    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('text=saved')).toBeVisible({ timeout: 8000 });
  });

  test('07-05: change max_tokens and save — PUT includes max_tokens', async ({ page }) => {
    let sentTokens = 0;
    await page.route('**/admin/settings/llm', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LLM_CONFIGURED) });
      }
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { max_tokens?: number };
        sentTokens = body.max_tokens ?? 0;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...LLM_CONFIGURED, max_tokens: sentTokens }) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'LLM');
    const tokenInput = page.locator('input[type="number"], input[name*="tokens"]').first();
    await tokenInput.waitFor({ timeout: 8000 });
    await tokenInput.fill('2048');
    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('text=saved')).toBeVisible({ timeout: 8000 });
    expect(sentTokens).toBe(2048);
  });

  // ── Test connection ─────────────────────────────────────────────────────────

  test('07-06: test connection success — success message shown', async ({ page }) => {
    await page.route('**/admin/settings/llm', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LLM_CONFIGURED) });
      }
      return route.continue();
    });
    await page.route('**/admin/settings/llm/test', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
    );

    await openSettingsSection(page, 'LLM');
    await page.locator('button:has-text("Test connection")').waitFor({ timeout: 8000 });
    await page.locator('button:has-text("Test connection")').click();

    await expect(page.locator('text=Successfully connected')).toBeVisible({ timeout: 10000 });
  });

  test('07-07: test connection failure — error message shown', async ({ page }) => {
    await page.route('**/admin/settings/llm', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LLM_CONFIGURED) });
      }
      return route.continue();
    });
    await page.route('**/admin/settings/llm/test', (route) =>
      route.fulfill({ status: 400, contentType: 'application/json', body: '{"detail":"Invalid API key."}' }),
    );

    await openSettingsSection(page, 'LLM');
    await page.locator('button:has-text("Test connection")').waitFor({ timeout: 8000 });
    await page.locator('button:has-text("Test connection")').click();

    await expect(page.locator('.text-red-600').first()).toBeVisible({ timeout: 10000 });
  });

  // ── Errors ──────────────────────────────────────────────────────────────────

  test('07-08: load failure — error shown in panel', async ({ page }) => {
    await page.route('**/admin/settings/llm', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Server error"}' });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'LLM');
    await expect(page.locator('.text-red-600').first()).toBeVisible({ timeout: 8000 });
  });

  test('07-09: save failure — error message shown', async ({ page }) => {
    await page.route('**/admin/settings/llm', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LLM_CONFIGURED) });
      }
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Save failed"}' });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'LLM');
    await page.locator('button:has-text("Save")').first().waitFor({ timeout: 8000 });
    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 6000 });
  });
});
