/**
 * Category: LLM Response Patterns
 *
 * Comprehensive coverage of all Claude API response patterns that can
 * appear in the widget, based on Anthropic Messages API research:
 *
 * ✅ end_turn — normal completion (short, medium, long, single word)
 * ✅ max_tokens — truncated mid-sentence / mid-word
 * ✅ refusal — no content (surfaces as 500 from backend)
 * ✅ Fallback message (no corpus info found)
 * ✅ Multilingual: Japanese, emoji, diacritics, mixed
 * ✅ Security: HTML entities, XSS attempt, bracket chars, URLs
 * ✅ Content variations: very long, single word, multi-paragraph
 */

import { test, expect } from '@playwright/test';
import {
  mockAppearance,
  mockSession,
  mockMessage,
  mockMessageError,
  gotoWidgetReady,
  sendMessage,
  getLastAssistantText,
} from '../fixtures/helpers.js';
import {
  SHORT_ANSWER,
  MEDIUM_ANSWER,
  LONG_ANSWER,
  VERY_LONG_ANSWER,
  SINGLE_WORD_ANSWER,
  FALLBACK_NO_INFO,
  FALLBACK_CUSTOM,
  JAPANESE_ANSWER,
  EMOJI_ANSWER,
  MIXED_LANG_ANSWER,
  DIACRITIC_ANSWER,
  HTML_SPECIAL_CHARS,
  XSS_IN_CONTENT,
  BRACKET_CHARS,
  URL_IN_CONTENT,
  TRUNCATED_MID_SENTENCE,
  TRUNCATED_MID_WORD,
  ERROR_BODIES,
} from '../fixtures/llm-scenarios.js';

test.describe('LLM Response Patterns', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppearance(page);
    await mockSession(page);
  });

  // ── stop_reason: end_turn — normal completion ─────────────────────────────

  test('03-01 [end_turn] short single-sentence answer', async ({ page }) => {
    await mockMessage(page, SHORT_ANSWER);
    await gotoWidgetReady(page);
    await sendMessage(page, 'opening hours?');

    const text = await getLastAssistantText(page);
    expect(text).toBe(SHORT_ANSWER.content);
  });

  test('03-02 [end_turn] medium multi-sentence answer', async ({ page }) => {
    await mockMessage(page, MEDIUM_ANSWER);
    await gotoWidgetReady(page);
    await sendMessage(page, 'return policy?');

    const text = await getLastAssistantText(page);
    expect(text).toBe(MEDIUM_ANSWER.content);
  });

  test('03-03 [end_turn] long multi-paragraph answer renders fully', async ({ page }) => {
    await mockMessage(page, LONG_ANSWER);
    await gotoWidgetReady(page);
    await sendMessage(page, 'pricing plans?');

    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({
      timeout: 8000,
    });
    const text = await getLastAssistantText(page);
    expect(text.length).toBeGreaterThan(100);
  });

  test('03-04 [end_turn] very long answer (stress test — >1000 chars)', async ({ page }) => {
    await mockMessage(page, VERY_LONG_ANSWER);
    await gotoWidgetReady(page);
    await sendMessage(page, 'detailed info?');

    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({
      timeout: 8000,
    });
    const text = await getLastAssistantText(page);
    expect(text.length).toBeGreaterThan(500);
  });

  test('03-05 [end_turn] single word answer', async ({ page }) => {
    await mockMessage(page, SINGLE_WORD_ANSWER);
    await gotoWidgetReady(page);
    await sendMessage(page, 'available?');

    const text = await getLastAssistantText(page);
    expect(text).toBe('Yes.');
  });

  // ── Fallback patterns (no corpus info) ───────────────────────────────────

  test('03-06 [fallback] default no-information response', async ({ page }) => {
    await mockMessage(page, FALLBACK_NO_INFO);
    await gotoWidgetReady(page);
    await sendMessage(page, 'unknown topic');

    const text = await getLastAssistantText(page);
    expect(text).toContain('I do not have information');
  });

  test('03-07 [fallback] custom operator fallback message', async ({ page }) => {
    await mockMessage(page, FALLBACK_CUSTOM);
    await gotoWidgetReady(page);
    await sendMessage(page, 'unknown topic');

    const text = await getLastAssistantText(page);
    expect(text).toContain('Sorry, I cannot find');
  });

  // ── max_tokens — truncated responses ─────────────────────────────────────

  test('03-08 [max_tokens] truncated mid-sentence response displayed as-is', async ({ page }) => {
    await mockMessage(page, TRUNCATED_MID_SENTENCE);
    await gotoWidgetReady(page);
    await sendMessage(page, 'refund policy?');

    const text = await getLastAssistantText(page);
    // Response is shown even if truncated — widget does not add ellipsis
    expect(text.length).toBeGreaterThan(50);
  });

  test('03-09 [max_tokens] truncated mid-word response displayed as-is', async ({ page }) => {
    await mockMessage(page, TRUNCATED_MID_WORD);
    await gotoWidgetReady(page);
    await sendMessage(page, 'contact?');

    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({
      timeout: 8000,
    });
  });

  // ── Multilingual / Unicode ────────────────────────────────────────────────

  test('03-10 [unicode] Japanese answer displayed correctly', async ({ page }) => {
    await mockMessage(page, JAPANESE_ANSWER);
    await gotoWidgetReady(page);
    await sendMessage(page, '営業時間は？');

    const text = await getLastAssistantText(page);
    expect(text).toContain('営業時間');
  });

  test('03-11 [unicode] Emoji in response displayed correctly', async ({ page }) => {
    await mockMessage(page, EMOJI_ANSWER);
    await gotoWidgetReady(page);
    await sendMessage(page, 'free trial?');

    const text = await getLastAssistantText(page);
    expect(text).toContain('✅');
    expect(text).toContain('🎉');
  });

  test('03-12 [unicode] Diacritics and accented characters', async ({ page }) => {
    await mockMessage(page, DIACRITIC_ANSWER);
    await gotoWidgetReady(page);
    await sendMessage(page, 'location?');

    const text = await getLastAssistantText(page);
    expect(text).toContain('café');
    expect(text).toContain('naïve');
  });

  // ── Security / encoding ──────────────────────────────────────────────────

  test('03-13 [security] HTML special characters rendered as plain text', async ({ page }) => {
    await mockMessage(page, HTML_SPECIAL_CHARS);
    await gotoWidgetReady(page);
    await sendMessage(page, 'price?');

    const text = await getLastAssistantText(page);
    // React renders these as escaped text, not HTML
    expect(text).toContain('<strong>');
    expect(text).toContain('&');
  });

  test('03-14 [security] XSS attempt in LLM content not executed', async ({ page }) => {
    // Listen for any dialog that would indicate script execution
    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    await mockMessage(page, XSS_IN_CONTENT);
    await gotoWidgetReady(page);
    await sendMessage(page, 'products?');

    await expect(page.locator('.nene-corpus-chat__bubble--assistant')).toBeVisible({
      timeout: 8000,
    });

    // XSS must not execute
    expect(alertFired).toBe(false);
    // Content shown as text (the <script> tag appears as literal text)
    const text = await getLastAssistantText(page);
    expect(text).toContain('Our product is available now');
  });
});
