/**
 * Admin E2E test helpers.
 *
 * Provides mock setup and common navigation helpers for the Admin SPA tests.
 * All API calls are intercepted by page.route() — no real backend needed.
 *
 * Key patterns:
 *  - mockAdminAuth()     sets up login + me + llm endpoints
 *  - loginAs()           navigates to /admin, fills form, waits for dashboard
 *  - bypassLogin()       injects token directly into sessionStorage (faster)
 *  - openSettings()      clicks Settings button and waits for modal
 *  - navToSection()      clicks nav item inside settings modal
 */

import type { Page } from '@playwright/test';
import {
  ADMIN_TOKEN,
  DEFAULT_LOGIN_RESPONSE,
  DEFAULT_ME_RESPONSE,
  LLM_CONFIGURED,
  DEFAULT_APPEARANCE,
  DEFAULT_LIMITS,
  DEFAULT_CHAT_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  SOURCE_LIST_EMPTY,
  SESSION_LIST_EMPTY,
} from './admin-api-mocks.js';

// ── Constants ─────────────────────────────────────────────────────────────────

export const ADMIN_URL = '/admin/';
export const ADMIN_TOKEN_KEY = 'nene-corpus.admin_token';

// ── Auth mocking ──────────────────────────────────────────────────────────────

/** Mock all required auth / bootstrap endpoints. */
export async function mockAdminAuth(
  page: Page,
  overrides: {
    loginResponse?: object;
    meResponse?: object;
    llmResponse?: object;
  } = {},
): Promise<void> {
  // POST /admin/auth/login
  await page.route('**/admin/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.loginResponse ?? DEFAULT_LOGIN_RESPONSE),
    }),
  );

  // GET /admin/auth/me  (also called on restore-session)
  await page.route('**/admin/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.meResponse ?? DEFAULT_ME_RESPONSE),
    }),
  );

  // GET /admin/settings/llm — called right after login to show/hide banner
  await page.route('**/admin/settings/llm', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(overrides.llmResponse ?? LLM_CONFIGURED),
      });
    }
    return route.continue();
  });
}

/** Mock all "page load" background endpoints with sane defaults. */
export async function mockDashboardDefaults(page: Page): Promise<void> {
  await page.route('**/admin/sources**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SOURCE_LIST_EMPTY),
      });
    }
    return route.continue();
  });

  await page.route('**/admin/chat/sessions**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SESSION_LIST_EMPTY),
      });
    }
    return route.continue();
  });
}

/** Mock settings endpoints used by SettingsModal panels. */
export async function mockSettingsEndpoints(page: Page): Promise<void> {
  await page.route('**/admin/appearance', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_APPEARANCE),
      });
    }
    return route.continue();
  });

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

  await page.route('**/admin/settings/limits', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_LIMITS),
      });
    }
    return route.continue();
  });

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
}

// ── Navigation helpers ────────────────────────────────────────────────────────

/**
 * Navigate to /admin/ and fill the login form.
 * Waits for the dashboard (Sources panel heading) to appear.
 */
export async function loginAs(
  page: Page,
  email = 'admin@example.com',
  password = 'password123',
): Promise<void> {
  await page.goto(ADMIN_URL);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  // Wait for main dashboard content — Sources panel heading
  await page.locator('h2:has-text("Sources")').waitFor({ timeout: 8000 });
}

/**
 * Bypass the login form by injecting the admin token directly into sessionStorage.
 * Also mocks /admin/auth/me so the restore-session flow succeeds.
 * Faster than loginAs() for tests that don't test the login form itself.
 */
export async function bypassLogin(page: Page): Promise<void> {
  await page.addInitScript(
    ([key, token]: [string, string]) => window.sessionStorage.setItem(key, token),
    [ADMIN_TOKEN_KEY, ADMIN_TOKEN],
  );
}

/**
 * Full setup: mock auth + dashboard + navigate via form login.
 */
export async function gotoAdminDashboard(page: Page): Promise<void> {
  await mockAdminAuth(page);
  await mockDashboardDefaults(page);
  await loginAs(page);
}

/**
 * Fast setup: inject token, mock me, mock dashboard, goto page.
 * Skips the login form. Use when auth form isn't the test subject.
 */
export async function gotoAdminDashboardFast(page: Page): Promise<void> {
  await bypassLogin(page);
  await mockAdminAuth(page);
  await mockDashboardDefaults(page);
  await page.goto(ADMIN_URL);
  await page.locator('h2:has-text("Sources")').waitFor({ timeout: 8000 });
}

// ── Settings modal helpers ────────────────────────────────────────────────────

/** Click the Settings button and wait for the modal dialog to open. */
export async function openSettings(page: Page): Promise<void> {
  await page.locator('button:has-text("Settings")').click();
  await page.locator('dialog[open]').waitFor({ timeout: 6000 });
}

/** Click a nav item inside the settings modal. */
export async function navToSection(
  page: Page,
  sectionText: string,
): Promise<void> {
  await page.locator(`dialog nav button:has-text("${sectionText}")`).click();
}

/** Open settings modal and navigate to a specific section in one call. */
export async function openSettingsSection(
  page: Page,
  sectionText: string,
): Promise<void> {
  await openSettings(page);
  await navToSection(page, sectionText);
}
