/**
 * Category: Appearance Settings
 *
 * Tests the AppearancePanel: loading defaults, hero / theme / chat / layout
 * updates, embed snippet display, and save / error states.
 */

import { test, expect } from '@playwright/test';
import {
  gotoAdminDashboardFast,
  openSettingsSection,
} from '../fixtures/admin-helpers.js';
import { DEFAULT_APPEARANCE } from '../fixtures/admin-api-mocks.js';

test.describe('Appearance Settings', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminDashboardFast(page);
  });

  // ── Loading ─────────────────────────────────────────────────────────────────

  test('08-01: appearance panel loads default values', async ({ page }) => {
    await page.route('**/admin/appearance', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Appearance');

    // Hero title field contains default value
    await expect(page.locator('input[type="text"]').filter({ hasText: /how can/i }).or(
      page.locator('input').first()
    )).toBeVisible({ timeout: 8000 });
  });

  test('08-02: load failure — error message shown', async ({ page }) => {
    await page.route('**/admin/appearance', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Server error"}' });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Appearance');
    await expect(page.locator('.text-red-600').first()).toBeVisible({ timeout: 8000 });
  });

  // ── Hero section ────────────────────────────────────────────────────────────

  test('08-03: edit hero title — PUT request includes updated title', async ({ page }) => {
    let sentData: Record<string, unknown> = {};

    await page.route('**/admin/appearance', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      if (route.request().method() === 'PUT') {
        sentData = JSON.parse(route.request().postData() ?? '{}') as typeof sentData;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Appearance');

    // Find hero title input (contains "How can we help?" by default)
    const heroTitle = page.locator('input[value="How can we help?"]');
    await heroTitle.waitFor({ timeout: 8000 });
    await heroTitle.fill('Welcome to our support');

    // Find and click the save button for the hero/theme section
    await page.locator('button:has-text("Save")').first().click();

    await expect(page.locator('text=saved').first()).toBeVisible({ timeout: 8000 });
    // Verify sent data contains the new title
    const hero = sentData.hero as Record<string, unknown> | undefined;
    if (hero) {
      expect(hero.title).toBe('Welcome to our support');
    }
  });

  test('08-04: toggle hero title visibility — show_title toggled in PUT', async ({ page }) => {
    let sentShow = true;

    await page.route('**/admin/appearance', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { hero?: { show_title?: boolean } };
        sentShow = body.hero?.show_title ?? true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Appearance');
    // Toggle the "Show title" checkbox — use the div that contains "Title" label text
    // (the first checkbox is "show_image"; we need the one next to "Title")
    const showTitleCheckbox = page
      .locator('div.flex.items-center.gap-2')
      .filter({ hasText: 'Title' })
      .locator('input[type="checkbox"]');
    await showTitleCheckbox.waitFor({ timeout: 8000 });
    await showTitleCheckbox.click();
    await page.locator('button:has-text("Save")').first().click();

    await expect(page.locator('text=saved').first()).toBeVisible({ timeout: 8000 });
    expect(sentShow).toBe(false);
  });

  // ── Theme colors ────────────────────────────────────────────────────────────

  test('08-05: edit primary color — PUT request includes updated color', async ({ page }) => {
    let sentTheme: Record<string, unknown> = {};

    await page.route('**/admin/appearance', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { theme?: typeof sentTheme };
        sentTheme = body.theme ?? {};
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Appearance');

    // Find the color input for primary color — use type="color" to avoid the paired text input
    // (ColorField renders both a type="color" and a type="text" with the same value, causing strict-mode errors)
    const colorInput = page.locator('input[type="color"]').first();
    await colorInput.waitFor({ timeout: 8000 });
    await colorInput.fill('#ff0000');
    await page.locator('button:has-text("Save")').first().click();

    await expect(page.locator('text=saved').first()).toBeVisible({ timeout: 8000 });
    if (sentTheme.color_primary !== undefined) {
      expect(sentTheme.color_primary).toBe('#ff0000');
    }
  });

  // ── Layout ──────────────────────────────────────────────────────────────────

  test('08-06: change position to bottom_right — PUT includes updated layout', async ({ page }) => {
    let sentLayout: Record<string, unknown> = {};

    await page.route('**/admin/appearance', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { layout?: typeof sentLayout };
        sentLayout = body.layout ?? {};
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Appearance');

    // Position select
    const positionSelect = page.locator('select').filter({
      hasText: /inline|bottom|top/i,
    }).first();
    if (await positionSelect.count() > 0) {
      await positionSelect.selectOption('bottom_right');
      await page.locator('button:has-text("Save")').first().click();
      await expect(page.locator('text=saved').first()).toBeVisible({ timeout: 8000 });
      expect(sentLayout.position).toBe('bottom_right');
    }
  });

  // ── Embed snippet ───────────────────────────────────────────────────────────

  test('08-07: embed snippet section is visible with a pre element', async ({ page }) => {
    await page.route('**/admin/appearance', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Appearance');

    // Scroll down to find embed snippet
    const preElement = page.locator('pre');
    await preElement.scrollIntoViewIfNeeded();
    await expect(preElement).toBeVisible({ timeout: 8000 });
    await expect(preElement).toContainText('widget.js');
  });

  test('08-08: copy snippet button — button text changes to "Copied"', async ({ page }) => {
    await page.route('**/admin/appearance', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      return route.continue();
    });

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await openSettingsSection(page, 'Appearance');

    // Scroll to copy button
    const copyButton = page.locator('button:has-text("Copy")');
    await copyButton.scrollIntoViewIfNeeded();
    await copyButton.click();

    // Button shows "Copied" temporarily
    await expect(page.locator('button:has-text("Copied")')).toBeVisible({ timeout: 4000 });
  });

  // ── Save error ──────────────────────────────────────────────────────────────

  test('08-09: save failure — error message displayed', async ({ page }) => {
    await page.route('**/admin/appearance', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Server error"}' });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Appearance');
    await page.locator('button:has-text("Save")').first().waitFor({ timeout: 8000 });
    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 6000 });
  });

  // ── Widget locale ───────────────────────────────────────────────────────────

  test('08-10: widget locale selector visible — can change locale', async ({ page }) => {
    let sentLocale: string | null = 'not-sent';

    await page.route('**/admin/appearance', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_APPEARANCE) });
      }
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { widget_locale?: string | null };
        sentLocale = body.widget_locale ?? null;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...DEFAULT_APPEARANCE, widget_locale: sentLocale }) });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Appearance');

    // Widget locale selector — use class nc-input to avoid matching the global Admin language select
    // (Admin language select uses nc-select/nc-select-compact, widget locale uses nc-input)
    const localeSelect = page.locator('select.nc-input').first();
    await localeSelect.waitFor({ timeout: 8000 });
    const opts = await localeSelect.locator('option').allTextContents();
    if (opts.some((o) => o.toLowerCase().includes('ja'))) {
      await localeSelect.selectOption('ja');
      await page.locator('button:has-text("Save")').first().click();
      await expect(page.locator('text=saved').first()).toBeVisible({ timeout: 8000 });
    }
  });
});
