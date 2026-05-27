/**
 * Category: Widget Initialization
 *
 * Tests that the widget loads correctly, creates a session on mount,
 * and handles unavailable backend gracefully.
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockAppearanceError,
  mockSession,
  mockSessionError,
  mockMessage,
  gotoWidget,
  DEFAULT_SESSION,
} from '../fixtures/helpers.js';

test.describe('Widget Initialization', () => {
  test('01-01: widget renders chat panel on load', async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);
    await mockMessage(page);
    await gotoWidget(page);

    await expect(page.locator('.nene-corpus-chat')).toBeVisible();
    await expect(page.locator('.nene-corpus-chat__input')).toBeVisible();
    await expect(page.locator('.nene-corpus-chat__submit')).toBeVisible();
  });

  test('01-02: widget automatically creates a session on mount', async ({ page }) => {
    let sessionCalled = false;
    await mockAppearance(page);
    await page.route('**/chat/sessions', (route) => {
      sessionCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_SESSION),
      });
    });
    await mockMessage(page);
    await gotoWidget(page);

    // Wait for input to become enabled (session established)
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 6000 });
    expect(sessionCalled).toBe(true);
  });

  test('01-03: input is disabled before session is established', async ({ page }) => {
    await mockAppearance(page);
    // Delay session response so we can observe the disabled state
    await page.route('**/chat/sessions', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_SESSION),
      });
    });
    await mockMessage(page);
    await page.goto('/widget-preview.html');

    // Input should be disabled initially
    await expect(page.locator('.nene-corpus-chat__input')).toBeDisabled();

    // After session resolves, input becomes enabled
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 5000 });
  });

  test('01-04: widget uses default appearance when appearance API fails', async ({ page }) => {
    await mockAppearanceError(page);
    await mockSession(page);
    await mockMessage(page);
    await gotoWidget(page);

    // Widget should still render (uses defaults)
    await expect(page.locator('.nene-corpus-chat')).toBeVisible();
    // Input still becomes enabled (session not affected)
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 6000 });
  });

  test('01-05: session creation failure shows error message', async ({ page }) => {
    await mockAppearance(page);
    await mockSessionError(page);
    await gotoWidget(page);

    await expect(page.locator('.nene-corpus-chat__error')).toBeVisible({ timeout: 5000 });
    // Input must remain disabled (no valid session)
    await expect(page.locator('.nene-corpus-chat__input')).toBeDisabled();
  });
});
