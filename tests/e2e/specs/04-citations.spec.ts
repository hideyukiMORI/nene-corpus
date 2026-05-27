/**
 * Category: Citation Display
 *
 * Tests all citation rendering patterns:
 * - No citations
 * - Single / multiple citations
 * - Page number display
 * - Long excerpts
 * - Special characters in excerpts
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockSession,
  mockMessage,
  gotoWidgetReady,
  sendMessage,
} from '../fixtures/helpers.js';
import {
  SHORT_ANSWER,
  ANSWER_WITH_SINGLE_CITATION,
  ANSWER_WITH_MULTIPLE_CITATIONS,
  ANSWER_WITH_PAGE_NUMBER,
  ANSWER_WITH_LONG_EXCERPT,
  ANSWER_WITH_SPECIAL_EXCERPT,
} from '../fixtures/llm-scenarios.js';

test.describe('Citation Display', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);
  });

  test('04-01: no citations — citations section not rendered', async ({ page }) => {
    await mockMessage(page, SHORT_ANSWER); // citations: []
    await gotoWidgetReady(page);
    await sendMessage(page, 'hours?');

    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({
      timeout: 8000,
    });
    // Citation list must NOT be present
    await expect(page.locator('.nene-corpus-chat__citations')).toHaveCount(0);
  });

  test('04-02: single citation — excerpt shown', async ({ page }) => {
    await mockMessage(page, ANSWER_WITH_SINGLE_CITATION);
    await gotoWidgetReady(page);
    await sendMessage(page, 'return policy?');

    await expect(page.locator('.nene-corpus-chat__citations')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.nene-corpus-chat__citation')).toHaveCount(1);
    await expect(page.locator('.nene-corpus-chat__citation-excerpt')).toContainText(
      'Returns accepted within 30 days',
    );
  });

  test('04-03: multiple citations — all excerpts shown', async ({ page }) => {
    await mockMessage(page, ANSWER_WITH_MULTIPLE_CITATIONS);
    await gotoWidgetReady(page);
    await sendMessage(page, 'payment?');

    await expect(page.locator('.nene-corpus-chat__citation')).toHaveCount(3, { timeout: 8000 });
  });

  test('04-04: citation with page number — shows "p.N"', async ({ page }) => {
    await mockMessage(page, ANSWER_WITH_PAGE_NUMBER);
    await gotoWidgetReady(page);
    await sendMessage(page, 'installation?');

    await expect(page.locator('.nene-corpus-chat__citation-meta')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.nene-corpus-chat__citation-meta')).toContainText('p.12');
  });

  test('04-05: citation without page number — no meta shown', async ({ page }) => {
    await mockMessage(page, ANSWER_WITH_SINGLE_CITATION); // no page_number
    await gotoWidgetReady(page);
    await sendMessage(page, 'policy?');

    await expect(page.locator('.nene-corpus-chat__citation')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.nene-corpus-chat__citation-meta')).toHaveCount(0);
  });

  test('04-06: citation with long excerpt — rendered without overflow crash', async ({ page }) => {
    await mockMessage(page, ANSWER_WITH_LONG_EXCERPT);
    await gotoWidgetReady(page);
    await sendMessage(page, 'warranty?');

    await expect(page.locator('.nene-corpus-chat__citation-excerpt')).toBeVisible({
      timeout: 8000,
    });
    const text = await page.locator('.nene-corpus-chat__citation-excerpt').innerText();
    expect(text.length).toBeGreaterThan(100);
  });

  test('04-07: citation excerpt with HTML special characters — rendered as plain text', async ({
    page,
  }) => {
    await mockMessage(page, ANSWER_WITH_SPECIAL_EXCERPT);
    await gotoWidgetReady(page);
    await sendMessage(page, 'price?');

    await expect(page.locator('.nene-corpus-chat__citation-excerpt')).toBeVisible({
      timeout: 8000,
    });
    const text = await page.locator('.nene-corpus-chat__citation-excerpt').innerText();
    expect(text).toContain('$9.99');
    // & must appear as ampersand, not as HTML entity
    expect(text).toContain('&');
  });
});
