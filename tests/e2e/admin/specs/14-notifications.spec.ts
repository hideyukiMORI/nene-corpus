/**
 * Category: Notification Settings
 *
 * Tests the NotificationsPanel: SMTP field loading, saving,
 * toggle switches, send test mail (success + failure), and error states.
 */

import { test, expect } from '@playwright/test';
import {
  gotoAdminDashboardFast,
  openSettingsSection,
} from '../fixtures/admin-helpers.js';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  CONFIGURED_NOTIFICATION_SETTINGS,
} from '../fixtures/admin-api-mocks.js';

test.describe('Notification Settings', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminDashboardFast(page);
  });

  // ── Loading ─────────────────────────────────────────────────────────────────

  test('14-01: notifications panel loads — SMTP host field visible', async ({ page }) => {
    await page.route('**/admin/notifications/settings', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS),
        });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Notifications');
    // SMTP host input (placeholder: "smtp.example.com")
    await expect(page.locator('input[placeholder="smtp.example.com"]')).toBeVisible({ timeout: 8000 });
  });

  test('14-02: notifications load failure — error message shown', async ({ page }) => {
    await page.route('**/admin/notifications/settings', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{"detail":"Server error"}',
        });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Notifications');
    await expect(page.locator('.text-red-500').first()).toBeVisible({ timeout: 8000 });
  });

  // ── Save SMTP settings ───────────────────────────────────────────────────────

  test('14-03: fill SMTP host and save — PUT includes smtp_host, success indicator shown', async ({
    page,
  }) => {
    let sentSmtpHost = '';
    await page.route('**/admin/notifications/settings', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS),
        });
      }
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { smtp_host?: string };
        sentSmtpHost = body.smtp_host ?? '';
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...DEFAULT_NOTIFICATION_SETTINGS, smtp_host: sentSmtpHost }),
        });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Notifications');
    const smtpHostInput = page.locator('input[placeholder="smtp.example.com"]');
    await smtpHostInput.waitFor({ timeout: 8000 });
    await smtpHostInput.fill('mail.company.com');

    await page.locator('button:has-text("Save")').first().click();

    // Success indicator (text-green-600)
    await expect(page.locator('.text-green-600').first()).toBeVisible({ timeout: 6000 });
    expect(sentSmtpHost).toBe('mail.company.com');
  });

  test('14-04: save failure — error indicator shown', async ({ page }) => {
    await page.route('**/admin/notifications/settings', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS),
        });
      }
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{"detail":"Database error"}',
        });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Notifications');
    await page.locator('button:has-text("Save")').first().waitFor({ timeout: 8000 });
    await page.locator('button:has-text("Save")').first().click();

    await expect(page.locator('.text-red-500').first()).toBeVisible({ timeout: 6000 });
  });

  // ── Toggle switches ──────────────────────────────────────────────────────────

  test('14-05: toggle rate_limit_notify_enabled — PUT payload includes that field', async ({
    page,
  }) => {
    let sentPayload: Record<string, unknown> = {};
    await page.route('**/admin/notifications/settings', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS),
        });
      }
      if (route.request().method() === 'PUT') {
        sentPayload = JSON.parse(route.request().postData() ?? '{}') as typeof sentPayload;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...DEFAULT_NOTIFICATION_SETTINGS, rate_limit_notify_enabled: true }),
        });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Notifications');

    // Toggle the rate limit notify checkbox/switch
    const rateToggle = page.locator('input[type="checkbox"]').first();
    await rateToggle.waitFor({ timeout: 8000 });
    await rateToggle.check();

    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('.text-green-600').first()).toBeVisible({ timeout: 6000 });

    // Verify the PUT payload contains the toggle field
    expect('rate_limit_notify_enabled' in sentPayload).toBe(true);
  });

  test('14-06: toggle daily_report_enabled — PUT payload includes that field', async ({ page }) => {
    let sentPayload: Record<string, unknown> = {};
    await page.route('**/admin/notifications/settings', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS),
        });
      }
      if (route.request().method() === 'PUT') {
        sentPayload = JSON.parse(route.request().postData() ?? '{}') as typeof sentPayload;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...DEFAULT_NOTIFICATION_SETTINGS, daily_report_enabled: true }),
        });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Notifications');

    // Toggle the daily report checkbox — typically the second checkbox in the panel
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.first().waitFor({ timeout: 8000 });
    const count = await checkboxes.count();
    // Check the last checkbox (daily_report_enabled is typically below rate_limit_notify_enabled)
    await checkboxes.nth(count - 1).check();

    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('.text-green-600').first()).toBeVisible({ timeout: 6000 });

    expect('daily_report_enabled' in sentPayload).toBe(true);
  });

  // ── Send test mail ───────────────────────────────────────────────────────────

  test('14-07: send test mail success — success indicator shown', async ({ page }) => {
    // SMTP must be configured to enable the test mail button
    await page.route('**/admin/notifications/settings', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(CONFIGURED_NOTIFICATION_SETTINGS),
        });
      }
      return route.continue();
    });
    await page.route('**/admin/notifications/test-mail', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );

    await openSettingsSection(page, 'Notifications');

    // Fill the test email address input (placeholder: "test@example.com")
    const testEmailInput = page.locator('input[placeholder="test@example.com"]');
    await testEmailInput.waitFor({ timeout: 8000 });
    await testEmailInput.fill('tester@example.com');

    // Send Test Email button (enabled when smtp_configured=true and email is set)
    await page.locator('button:has-text("Send Test Email")').click();

    // Success: text-green-600
    await expect(page.locator('.text-green-600').first()).toBeVisible({ timeout: 6000 });
  });

  test('14-08: send test mail failure — error indicator shown', async ({ page }) => {
    await page.route('**/admin/notifications/settings', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(CONFIGURED_NOTIFICATION_SETTINGS),
        });
      }
      return route.continue();
    });
    await page.route('**/admin/notifications/test-mail', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"detail":"SMTP connection refused"}',
      }),
    );

    await openSettingsSection(page, 'Notifications');

    const testEmailInput = page.locator('input[placeholder="test@example.com"]');
    await testEmailInput.waitFor({ timeout: 8000 });
    await testEmailInput.fill('tester@example.com');

    await page.locator('button:has-text("Send Test Email")').click();

    // Failure: text-red-500
    await expect(page.locator('.text-red-500').first()).toBeVisible({ timeout: 6000 });
  });
});
