/**
 * Category: Authentication
 *
 * Tests all auth flows: login (happy + error), logout, token restore,
 * and password reset request / confirm.
 */

import { test, expect } from '@playwright/test';
import {
  ADMIN_URL,
  ADMIN_TOKEN_KEY,
  mockAdminAuth,
  mockDashboardDefaults,
  bypassLogin,
  loginAs,
  gotoAdminDashboard,
} from '../fixtures/admin-helpers.js';
import { ADMIN_TOKEN, DEFAULT_LOGIN_RESPONSE, DEFAULT_ME_RESPONSE } from '../fixtures/admin-api-mocks.js';

test.describe('Authentication', () => {
  // ── Login happy path ────────────────────────────────────────────────────────

  test('01-01: valid credentials — dashboard renders, email shown in header', async ({ page }) => {
    await mockAdminAuth(page);
    await mockDashboardDefaults(page);
    await loginAs(page);

    // Admin email shown in header
    await expect(page.locator('header')).toContainText('admin@example.com');
    // Main content sections appear
    await expect(page.locator('h2:has-text("Upload source")')).toBeVisible();
    await expect(page.locator('h2:has-text("Sources")')).toBeVisible();
    await expect(page.locator('h2:has-text("Conversation logs")')).toBeVisible();
  });

  test('01-02: login form fields present — email prefilled, password empty', async ({ page }) => {
    await page.goto(ADMIN_URL);
    // Email has a default prefill (admin@example.com)
    await expect(page.locator('input[type="email"]')).toHaveValue('admin@example.com');
    await expect(page.locator('input[type="password"]')).toHaveValue('');
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in');
  });

  test('01-03: wrong password — error message shown, no navigation away', async ({ page }) => {
    await page.route('**/admin/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid credentials.' }),
      }),
    );
    await page.goto(ADMIN_URL);
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Error message visible
    await expect(page.locator('form .text-red-600')).toBeVisible({ timeout: 6000 });
    // Still on login page
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in');
  });

  test('01-04: empty password — HTML5 validation prevents submission', async ({ page }) => {
    let loginCalled = false;
    await page.route('**/admin/auth/login', (route) => {
      loginCalled = true;
      return route.continue();
    });
    await page.goto(ADMIN_URL);
    // Leave password empty; clear email too to trigger validation
    await page.locator('input[type="password"]').fill('');
    await page.locator('button[type="submit"]').click();
    expect(loginCalled).toBe(false);
  });

  test('01-05: network error on login — error message shown', async ({ page }) => {
    await page.route('**/admin/auth/login', (route) => route.abort('failed'));
    await page.goto(ADMIN_URL);
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('somepass');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('form .text-red-600')).toBeVisible({ timeout: 6000 });
  });

  // ── Logout ──────────────────────────────────────────────────────────────────

  test('01-06: logout — returns to login form, token removed from storage', async ({ page }) => {
    await gotoAdminDashboard(page);

    // Logout button in header
    await page.locator('header button:has-text("Sign out")').click();

    // Login form reappears
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible({
      timeout: 6000,
    });

    // Token cleared from sessionStorage
    const stored = await page.evaluate(
      (key: string) => window.sessionStorage.getItem(key),
      ADMIN_TOKEN_KEY,
    );
    expect(stored).toBeNull();
  });

  // ── Token restore on reload ─────────────────────────────────────────────────

  test('01-07: page reload with stored token — dashboard restored without login form', async ({
    page,
  }) => {
    // Pre-seed token into sessionStorage
    await bypassLogin(page);
    // Mock the me endpoint for restore-session
    await page.route('**/admin/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_ME_RESPONSE),
      }),
    );
    await page.route('**/admin/settings/llm', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: true, api_key_masked: '***', model: 'claude-haiku-4-5-20251001', max_tokens: 1024 }) }),
    );
    await mockDashboardDefaults(page);
    await page.goto(ADMIN_URL);

    // Login form must NOT appear
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toHaveCount(0, {
      timeout: 6000,
    });
    // Dashboard is shown
    await expect(page.locator('h2:has-text("Sources")')).toBeVisible({ timeout: 6000 });
  });

  test('01-08: stale / expired token (me returns 401) — redirected to login', async ({ page }) => {
    await bypassLogin(page);
    // Token exists but me returns 401
    await page.route('**/admin/auth/me', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Token expired.' }),
      }),
    );
    await page.goto(ADMIN_URL);

    // Should fall back to login form
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible({
      timeout: 8000,
    });
  });

  // ── Password reset ──────────────────────────────────────────────────────────

  test('01-09: "Forgot your password?" link — shows request form', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.locator('button:has-text("Forgot your password?")').click();

    // Request form heading visible
    await expect(page.locator('h2:has-text("Password reset")')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('01-10: password reset request submitted — success message shown', async ({ page }) => {
    await page.route('**/admin/auth/password-reset/request', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );
    await page.goto(ADMIN_URL);
    await page.locator('button:has-text("Forgot your password?")').click();
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('button[type="submit"]').click();

    // Success message (server always returns OK to prevent enumeration)
    await expect(page.locator('p:has-text("reset")')).toBeVisible({ timeout: 6000 });
  });

  test('01-11: password reset back button — returns to login', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.locator('button:has-text("Forgot your password?")').click();
    await page.locator('button:has-text("Back")').click();

    // Back at login
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible({
      timeout: 6000,
    });
  });

  test('01-12: login API 500 server error — graceful error display', async ({ page }) => {
    await page.route('**/admin/auth/login', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error.' }),
      }),
    );
    await page.goto(ADMIN_URL);
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('pass1234');
    await page.locator('button[type="submit"]').click();

    // Error shown, not blank page
    await expect(page.locator('form .text-red-600')).toBeVisible({ timeout: 6000 });
  });

  // ── Token saved ─────────────────────────────────────────────────────────────

  test('01-13: successful login — token stored in sessionStorage', async ({ page }) => {
    await mockAdminAuth(page);
    await mockDashboardDefaults(page);
    await loginAs(page);

    const stored = await page.evaluate(
      (key: string) => window.sessionStorage.getItem(key),
      ADMIN_TOKEN_KEY,
    );
    expect(stored).toBe(ADMIN_TOKEN);
  });
});
