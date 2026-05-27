/**
 * Category: Hero Section
 *
 * Tests hero visibility, title/description/CTA rendering,
 * and hero hiding after first message.
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockSession,
  mockMessage,
  gotoWidgetReady,
  sendMessage,
  DEFAULT_APPEARANCE,
} from '../fixtures/helpers.js';
import { SHORT_ANSWER } from '../fixtures/llm-scenarios.js';

test.describe('Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page);
    await mockMessage(page, SHORT_ANSWER);
  });

  test('08-01: hero shown with title and description before any messages', async ({ page }) => {
    await mockAppearance(page, {
      ...DEFAULT_APPEARANCE,
      hero: {
        ...DEFAULT_APPEARANCE.hero,
        title: 'How can we help?',
        description: 'Ask anything about our products.',
        show_title: true,
        show_description: true,
        show_cta: false,
      },
    });
    await gotoWidgetReady(page);

    await expect(page.locator('.nene-corpus-chat__hero')).toBeVisible();
    await expect(page.locator('.nene-corpus-chat__hero-title')).toContainText('How can we help?');
    await expect(page.locator('.nene-corpus-chat__hero-description')).toContainText(
      'Ask anything about our products.',
    );
  });

  test('08-02: hero hidden after first message sent', async ({ page }) => {
    await mockAppearance(page);
    await gotoWidgetReady(page);

    // Hero visible before message
    await expect(page.locator('.nene-corpus-chat__hero')).toBeVisible();

    // Send a message
    await sendMessage(page, 'Hide the hero!');

    // Hero must disappear
    await expect(page.locator('.nene-corpus-chat__hero')).toHaveCount(0, { timeout: 8000 });
  });

  test('08-03: CTA button focuses the input', async ({ page }) => {
    await mockAppearance(page, {
      ...DEFAULT_APPEARANCE,
      hero: {
        ...DEFAULT_APPEARANCE.hero,
        show_cta: true,
        cta_label: 'Ask a question',
      },
    });
    await gotoWidgetReady(page);

    await expect(page.locator('.nene-corpus-chat__hero-cta')).toBeVisible();
    await page.locator('.nene-corpus-chat__hero-cta').click();

    // Input should have focus after CTA click
    await expect(page.locator('.nene-corpus-chat__input')).toBeFocused();
  });

  test('08-04: hero not shown when all hero content disabled', async ({ page }) => {
    await mockAppearance(page, {
      ...DEFAULT_APPEARANCE,
      hero: {
        ...DEFAULT_APPEARANCE.hero,
        title: null,
        description: null,
        cta_label: null,
        show_title: false,
        show_description: false,
        show_cta: false,
        show_image: false,
        image_url: null,
      },
    });
    await gotoWidgetReady(page);

    await expect(page.locator('.nene-corpus-chat__hero')).toHaveCount(0);
  });

  test('08-05: hero with only CTA (no title/description)', async ({ page }) => {
    await mockAppearance(page, {
      ...DEFAULT_APPEARANCE,
      hero: {
        ...DEFAULT_APPEARANCE.hero,
        show_title: false,
        show_description: false,
        show_cta: true,
        cta_label: 'Start chatting',
      },
    });
    await gotoWidgetReady(page);

    // Hero shown (has CTA)
    await expect(page.locator('.nene-corpus-chat__hero')).toBeVisible();
    await expect(page.locator('.nene-corpus-chat__hero-cta')).toContainText('Start chatting');
    // Title and description not shown
    await expect(page.locator('.nene-corpus-chat__hero-title')).toHaveCount(0);
    await expect(page.locator('.nene-corpus-chat__hero-description')).toHaveCount(0);
  });
});
