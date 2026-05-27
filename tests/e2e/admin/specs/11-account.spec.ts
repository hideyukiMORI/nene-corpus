/**
 * Category: Account Settings
 *
 * Tests the AccountPanel: change password and change email forms,
 * validation, success, and error states.
 */

import { test, expect } from '@playwright/test';
import {
  gotoAdminDashboardFast,
  openSettingsSection,
} from '../fixtures/admin-helpers.js';

test.describe('Account Settings', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminDashboardFast(page);
  });

  // ── Change password ─────────────────────────────────────────────────────────

  test('11-01: account panel has password and email forms', async ({ page }) => {
    await openSettingsSection(page, 'Account');

    await expect(page.locator('h3:has-text("Change password")')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('h3:has-text("Change email address")')).toBeVisible();
  });

  test('11-02: change password — PUT request sent with current and new passwords', async ({
    page,
  }) => {
    let sentPayload: Record<string, string> = {};
    await page.route('**/admin/auth/password', (route) => {
      if (route.request().method() === 'PUT') {
        sentPayload = JSON.parse(route.request().postData() ?? '{}') as typeof sentPayload;
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Account');

    // Fill password form — use .first() since email form also has current-password
    const currentPw = page.locator('input[autocomplete="current-password"]').first();
    const newPw = page.locator('input[autocomplete="new-password"]').first();
    const confirmPw = page.locator('input[autocomplete="new-password"]').last();

    await currentPw.waitFor({ timeout: 8000 });
    await currentPw.fill('old-password-123');
    await newPw.fill('new-password-456');
    await confirmPw.fill('new-password-456');

    await page.locator('button:has-text("Change password")').first().click();

    await expect(page.locator('text=Password changed')).toBeVisible({ timeout: 8000 });
    expect(sentPayload.current_password).toBe('old-password-123');
    expect(sentPayload.new_password).toBe('new-password-456');
  });

  test('11-03: password mismatch — error shown, API not called', async ({ page }) => {
    let called = false;
    await page.route('**/admin/auth/password', (route) => {
      called = true;
      return route.continue();
    });

    await openSettingsSection(page, 'Account');

    const currentPw = page.locator('input[autocomplete="current-password"]').first();
    const newPw = page.locator('input[autocomplete="new-password"]').first();
    const confirmPw = page.locator('input[autocomplete="new-password"]').last();

    await currentPw.waitFor({ timeout: 8000 });
    await currentPw.fill('old-password-123');
    await newPw.fill('new-password-456');
    await confirmPw.fill('different-password');

    await page.locator('button:has-text("Change password")').first().click();

    await expect(page.locator('text=do not match')).toBeVisible({ timeout: 4000 });
    expect(called).toBe(false);
  });

  test('11-04: password too short (< 8 chars) — error shown', async ({ page }) => {
    let called = false;
    await page.route('**/admin/auth/password', (route) => {
      called = true;
      return route.continue();
    });

    await openSettingsSection(page, 'Account');

    const currentPw = page.locator('input[autocomplete="current-password"]').first();
    const newPw = page.locator('input[autocomplete="new-password"]').first();
    const confirmPw = page.locator('input[autocomplete="new-password"]').last();

    await currentPw.waitFor({ timeout: 8000 });
    await currentPw.fill('old-password-123');
    await newPw.fill('short');
    await confirmPw.fill('short');

    await page.locator('button:has-text("Change password")').first().click();

    await expect(page.locator('text=8 characters')).toBeVisible({ timeout: 4000 });
    expect(called).toBe(false);
  });

  test('11-05: change password API failure — error shown', async ({ page }) => {
    await page.route('**/admin/auth/password', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Current password incorrect."}' });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Account');

    const currentPw = page.locator('input[autocomplete="current-password"]').first();
    const newPw = page.locator('input[autocomplete="new-password"]').first();
    const confirmPw = page.locator('input[autocomplete="new-password"]').last();

    await currentPw.waitFor({ timeout: 8000 });
    await currentPw.fill('wrong-password');
    await newPw.fill('new-password-456');
    await confirmPw.fill('new-password-456');

    await page.locator('button:has-text("Change password")').first().click();

    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 6000 });
  });

  // ── Change email ────────────────────────────────────────────────────────────

  test('11-06: change email — PUT request sent with new email', async ({ page }) => {
    let sentEmail = '';
    await page.route('**/admin/auth/email', (route) => {
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() ?? '{}') as { new_email?: string };
        sentEmail = body.new_email ?? '';
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Account');

    // Email change form — fill current-password first (email form uses current-password too)
    const emailCurrentPw = page.locator('input[autocomplete="current-password"]').last();
    await emailCurrentPw.waitFor({ timeout: 8000 });
    await emailCurrentPw.fill('current-password');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('newemail@example.com');
    await page.locator('button:has-text("Change email")').first().click();

    await expect(page.locator('text=Email address changed')).toBeVisible({ timeout: 8000 });
    expect(sentEmail).toBe('newemail@example.com');
  });

  test('11-07: change email API failure — error shown', async ({ page }) => {
    await page.route('**/admin/auth/email', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 409, contentType: 'application/json', body: '{"detail":"Email already in use."}' });
      }
      return route.continue();
    });

    await openSettingsSection(page, 'Account');

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ timeout: 8000 });
    await emailInput.fill('taken@example.com');
    await page.locator('button:has-text("Change email")').first().click();

    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 6000 });
  });
});
