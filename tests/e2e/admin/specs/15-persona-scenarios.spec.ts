/**
 * Category: Persona UX Scenario Testing (#253)
 *
 * Runs 200 persona-driven full-journey scenarios to discover UX friction points.
 *
 * Each test annotates which checkpoints passed/failed so the post-run
 * report script can aggregate statistics.
 *
 * Scenario checkpoints (in order):
 *   CP1  login            — reach dashboard via login form
 *   CP2  llm_config       — open Settings → LLM → enter key → save
 *   CP3  source_upload    — upload a source (text/csv/pdf or invalid type)
 *   CP4  widget_preview   — open widget-preview.html, widget renders
 *   CP5  chat             — send a chat message, get response
 *   CP6  conversation_log — view conversation log panel, see the session
 *   CP7  logout           — click Sign out → back to login form
 */

import { test, expect } from '@playwright/test';
import {
  ADMIN_URL,
  ADMIN_TOKEN_KEY,
  mockAdminAuth,
  mockDashboardDefaults,
  mockSettingsEndpoints,
} from '../fixtures/admin-helpers.js';
import {
  ADMIN_TOKEN,
  DEFAULT_LOGIN_RESPONSE,
  DEFAULT_ME_RESPONSE,
  LLM_CONFIGURED,
  LLM_NOT_CONFIGURED,
  SOURCE_LIST_EMPTY,
  SESSION_LIST_EMPTY,
  SESSION_LIST_THREE,
  SESSION_MESSAGES,
  CSV_PREVIEW,
  PDF_PREVIEW,
  CREATE_SOURCE_RESULT,
} from '../fixtures/admin-api-mocks.js';
import { PERSONAS, type Persona, type BehaviorPattern } from '../fixtures/personas.js';

test.describe.configure({ mode: 'parallel' });

// ── Shared mock API responses ─────────────────────────────────────────────────

const WIDGET_SESSION = { session_id: 1, session_token: 'persona-test-token' };
const WIDGET_RESPONSE = {
  message_id: 1, session_id: 1, role: 'assistant' as const,
  content: 'こちらの情報をご参照ください。ご不明点がございましたら再度ご質問ください。',
  citations: [],
};
const WIDGET_RESPONSE_WITH_CITATION = {
  message_id: 1, session_id: 1, role: 'assistant' as const,
  content: 'ご質問の件ですが、以下の資料に記載がございます。',
  citations: [{ chunk_id: 1, document_id: 1, source_id: 1, excerpt: '詳細は資料をご確認ください。', page_number: 1 }],
};

// ── Checkpoint tracker ────────────────────────────────────────────────────────

type CheckpointKey = 'login' | 'llm_config' | 'source_upload' | 'widget_preview' | 'chat' | 'conversation_log' | 'logout';
type CheckpointResult = 'pass' | 'fail' | 'skip' | 'blocked_as_expected';

interface ScenarioRecord {
  personaId: string;
  behavior: BehaviorPattern;
  industry: string;
  techLevel: string;
  checkpoints: Record<CheckpointKey, CheckpointResult>;
  notes: string[];
}

// ── Setup helpers per behavior ────────────────────────────────────────────────

async function setupCommonMocks(page: import('@playwright/test').Page, persona: Persona): Promise<void> {
  // Auth endpoints
  await page.route('**/admin/auth/login', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_LOGIN_RESPONSE) }),
  );
  await page.route('**/admin/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_ME_RESPONSE) }),
  );
  await page.route('**/admin/auth/password-reset/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );

  // LLM settings — initially not configured for skip_llm behavior
  const llmInitial = persona.behavior === 'skip_llm' || persona.behavior === 'api_key_wrong_fmt'
    ? LLM_NOT_CONFIGURED
    : LLM_CONFIGURED;

  await page.route('**/admin/settings/llm', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(llmInitial) });
    }
    if (route.request().method() === 'PUT') {
      const body = JSON.parse(route.request().postData() ?? '{}') as { api_key?: string };
      const key = body.api_key ?? '';
      // Validate API key format: must start with 'sk-ant-'
      if (key.length < 10) {
        return route.fulfill({ status: 400, contentType: 'application/json', body: '{"detail":"API key is too short or invalid format."}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...LLM_CONFIGURED, configured: true }) });
    }
    if (route.request().method() === 'POST') { // test connection
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    }
    return route.continue();
  });
  await page.route('**/admin/settings/llm/test', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  );

  // Sources
  await page.route('**/admin/sources**', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SOURCE_LIST_EMPTY) });
    }
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CREATE_SOURCE_RESULT) });
    }
    if (route.request().method() === 'DELETE') {
      return route.fulfill({ status: 204, body: '' });
    }
    return route.continue();
  });

  // Ingestion previews
  await page.route('**/admin/ingestion/csv/preview', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CSV_PREVIEW) }),
  );
  await page.route('**/admin/ingestion/pdf/preview', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PDF_PREVIEW) }),
  );

  // Chat sessions (admin)
  await page.route('**/admin/chat/sessions**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION_LIST_THREE) });
    }
    return route.continue();
  });

  // Session messages
  await page.route('**/admin/chat/sessions/*/messages**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION_MESSAGES) }),
  );

  // Settings (appearance, chat settings, limits, notifications)
  await mockSettingsEndpoints(page);

  // Widget appearance
  await page.route('**/widget/appearance', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      widget_locale: null,
      theme: { color_primary: '#2563eb', color_surface: '#ffffff', color_text: '#1a1a2e', radius_panel: '0.75rem', radius_control: '0.5rem', max_width: '480px' },
      hero: { title: 'How can we help?', description: 'Ask a question.', cta_label: 'Ask', show_title: true, show_description: true, show_cta: true, show_image: false, image_url: null, image_alt: null, gap_after: '1rem', padding_bottom: '1rem', show_divider: true },
      chat: { user_avatar_mode: 'silhouette', show_assistant_avatar: true, assistant_avatar_url: null, assistant_avatar_alt: null },
      layout: { max_height: '32rem', position: 'inline', offset_x: 16, offset_y: 16, floating_launcher: false },
      custom_css: null,
    }) }),
  );

  // Widget chat session + message
  await page.route('**/chat/sessions', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_SESSION) }),
  );
  await page.route('**/chat/messages', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WIDGET_RESPONSE_WITH_CITATION) }),
  );
}

// ── Individual checkpoint functions ──────────────────────────────────────────

async function cpLogin(page: import('@playwright/test').Page, persona: Persona): Promise<{ result: CheckpointResult; note: string }> {
  try {
    await page.goto(ADMIN_URL);
    await page.locator('input[type="email"]').fill(persona.email);
    await page.locator('input[type="password"]').fill(persona.password);
    await page.locator('button[type="submit"]').click();
    await page.locator('h2:has-text("Sources")').waitFor({ timeout: 10000 });
    return { result: 'pass', note: 'Logged in successfully' };
  } catch {
    return { result: 'fail', note: 'Login failed — could not reach dashboard' };
  }
}

async function cpLlmConfig(page: import('@playwright/test').Page, persona: Persona): Promise<{ result: CheckpointResult; note: string }> {
  if (persona.behavior === 'skip_llm') {
    // User skips LLM config; banner should be visible
    const bannerVisible = await page.locator('button:has-text("Configure LLM")').isVisible().catch(() => false);
    return {
      result: 'blocked_as_expected',
      note: bannerVisible
        ? 'LLM banner shown — user skipped config (banner guides correctly)'
        : 'LLM banner NOT shown — user unaware LLM is unconfigured (UX gap)',
    };
  }

  try {
    await page.locator('header button:has-text("Settings")').click();
    await page.locator('dialog[open]').waitFor({ timeout: 6000 });
    await page.locator('dialog nav button:has-text("LLM")').click();

    const keyInput = page.locator('input[placeholder*="key"], input[placeholder*="Key"], input[type="password"]').first();
    await keyInput.waitFor({ timeout: 6000 });

    if (persona.behavior === 'api_key_wrong_fmt') {
      await keyInput.fill(persona.apiKey); // too short, invalid
      await page.locator('button:has-text("Save")').first().click();
      // Check for error message
      const errVisible = await page.locator('.text-red-600').first().isVisible().catch(() => false);
      await page.keyboard.press('Escape'); // close modal
      return {
        result: 'blocked_as_expected',
        note: errVisible
          ? 'Invalid API key correctly rejected with error message'
          : 'Invalid API key accepted without error — validation gap',
      };
    }

    await keyInput.fill(persona.apiKey);
    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('text=saved').first()).toBeVisible({ timeout: 6000 });
    await page.keyboard.press('Escape');
    return { result: 'pass', note: 'LLM API key saved successfully' };
  } catch (e) {
    return { result: 'fail', note: `LLM config failed: ${e instanceof Error ? e.message : 'unknown'}` };
  }
}

async function cpSourceUpload(page: import('@playwright/test').Page, persona: Persona): Promise<{ result: CheckpointResult; note: string }> {
  const behavior = persona.behavior;

  if (behavior === 'empty_source_chat') {
    // Skip upload — go straight to chat (no sources)
    return { result: 'skip', note: 'Intentionally skipped upload to test empty-corpus chat' };
  }

  try {
    if (behavior === 'wrong_file_type') {
      // Attempt .docx upload
      await page.locator('button:has-text("File upload")').click();
      await page.locator('input[type="file"]').setInputFiles({
        name: 'document.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: Buffer.from('fake docx content for persona test'),
      });
      const errVisible = await page.locator('.text-red-600').first().isVisible({ timeout: 5000 }).catch(() => false);
      return {
        result: 'blocked_as_expected',
        note: errVisible
          ? 'Unsupported .docx correctly shows error — user can recover by switching to text'
          : 'No error for .docx upload — file type restriction not communicated (UX gap)',
      };
    }

    if (behavior === 'novice_validation') {
      // Try to submit text mode with empty name
      await page.locator('button:has-text("Paste text")').click();
      await page.locator('textarea').fill(persona.sourceContent);
      // Leave name empty
      await page.locator('button:has-text("Ingest into corpus")').click();
      const errVisible = await page.locator('.text-red-600, [role="alert"]').first().isVisible({ timeout: 5000 }).catch(() => false);
      if (!errVisible) {
        return { result: 'blocked_as_expected', note: 'Empty name submitted — no visible validation message (UX gap: silent fail)' };
      }
      // Recovery: fill name and try again
      await page.locator('input[placeholder="Product catalog"]').fill(persona.sourceName || 'My Source');
      await page.locator('button:has-text("Ingest into corpus")').click();
      const success = await page.locator('.text-emerald-700').first().isVisible({ timeout: 8000 }).catch(() => false);
      return {
        result: success ? 'pass' : 'fail',
        note: success ? 'Validation error → recovery succeeded' : 'Could not recover from validation error',
      };
    }

    if (behavior === 'csv_no_column_map') {
      await page.locator('button:has-text("File upload")').click();
      await page.locator('input[type="file"]').setInputFiles({
        name: 'data.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('title,description,category\nProduct A,Desc A,Electronics'),
      });
      await page.locator('button:has-text("Preview file")').click();
      await page.locator('text=50 rows').waitFor({ timeout: 8000 });

      // Uncheck ALL content columns to make Ingest disabled
      const contentGroup = page.getByRole('group', { name: /Content columns/i });
      const checkboxes = contentGroup.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) {
        if (await checkboxes.nth(i).isChecked()) await checkboxes.nth(i).uncheck();
      }

      const ingestBtn = page.locator('button:has-text("Ingest into corpus")');
      const isDisabled = await ingestBtn.isDisabled().catch(() => false);
      return {
        result: 'blocked_as_expected',
        note: isDisabled
          ? 'Ingest correctly disabled when no content columns selected'
          : 'Ingest enabled even with no content columns — UX gap (silent bad upload)',
      };
    }

    // Normal upload path (text, pdf, long_content, special_chars, expert_fast, happy_path)
    if (persona.sourceType === 'text' || persona.sourceType === 'docx' || persona.sourceType === 'xlsx') {
      await page.locator('button:has-text("Paste text")').click();

      const nameInput = page.locator('input[placeholder="Product catalog"]');
      if (persona.sourceName) await nameInput.fill(persona.sourceName);
      await page.locator('textarea').fill(persona.sourceContent);
      await page.locator('button:has-text("Ingest into corpus")').click();

      const success = await page.locator('.text-emerald-700').first().isVisible({ timeout: 10000 }).catch(() => false);
      return {
        result: success ? 'pass' : 'fail',
        note: success ? `Text source "${persona.sourceName}" ingested` : 'Ingest success message not shown',
      };
    }

    if (persona.sourceType === 'pdf') {
      await page.locator('button:has-text("File upload")').click();
      await page.locator('input[type="file"]').setInputFiles({
        name: `${persona.industryEn}-manual.pdf`,
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 fake pdf content for persona test'),
      });
      await page.locator('button:has-text("Preview file")').click();
      await page.locator('text=10 pages').waitFor({ timeout: 8000 });
      await page.locator('button:has-text("Ingest into corpus")').click();
      const success = await page.locator('.text-emerald-700').first().isVisible({ timeout: 10000 }).catch(() => false);
      return {
        result: success ? 'pass' : 'fail',
        note: success ? 'PDF ingested successfully' : 'PDF ingest failed',
      };
    }

    if (persona.sourceType === 'csv') {
      await page.locator('button:has-text("File upload")').click();
      await page.locator('input[type="file"]').setInputFiles({
        name: `${persona.industryEn}-data.csv`,
        mimeType: 'text/csv',
        buffer: Buffer.from('title,description\nProduct A,Desc A\nProduct B,Desc B'),
      });
      await page.locator('button:has-text("Preview file")').click();
      await page.locator('text=50 rows').waitFor({ timeout: 8000 });
      // Title column should be auto-filled; content columns auto-selected
      await page.locator('button:has-text("Ingest into corpus")').click();
      const success = await page.locator('.text-emerald-700').first().isVisible({ timeout: 10000 }).catch(() => false);
      return {
        result: success ? 'pass' : 'fail',
        note: success ? 'CSV ingested successfully' : 'CSV ingest failed',
      };
    }

    return { result: 'fail', note: `Unknown sourceType: ${persona.sourceType}` };
  } catch (e) {
    return { result: 'fail', note: `Source upload threw: ${e instanceof Error ? e.message.slice(0, 120) : 'unknown'}` };
  }
}

async function cpWidgetPreview(page: import('@playwright/test').Page, persona: Persona): Promise<{ result: CheckpointResult; note: string }> {
  if (persona.behavior === 'empty_source_chat' || persona.behavior === 'skip_llm') {
    // Go to widget preview even with no sources / no LLM — tests graceful state
  }
  try {
    await page.goto('/widget-preview.html');
    const inputVisible = await page.locator('.nene-corpus-chat__input').isVisible({ timeout: 8000 }).catch(() => false);
    const errorVisible = await page.locator('.nene-corpus-chat__error').isVisible().catch(() => false);

    if (inputVisible) {
      return { result: 'pass', note: 'Widget renders with chat input ready' };
    }
    if (errorVisible) {
      return { result: 'partial' as CheckpointResult, note: 'Widget renders but shows error state' };
    }
    return { result: 'fail', note: 'Widget did not render expected elements' };
  } catch (e) {
    return { result: 'fail', note: `Widget preview failed: ${e instanceof Error ? e.message.slice(0, 80) : '?'}` };
  }
}

// We need 'partial' in type:
type CheckpointResultExtended = CheckpointResult | 'partial';

async function cpChat(page: import('@playwright/test').Page, persona: Persona): Promise<{ result: CheckpointResultExtended; note: string }> {
  try {
    await expect(page.locator('.nene-corpus-chat__input')).toBeEnabled({ timeout: 8000 });
    await page.locator('.nene-corpus-chat__input').fill(persona.chatMessage);
    await page.locator('.nene-corpus-chat__submit').click();

    const response = await page.locator('.nene-corpus-chat__bubble--assistant').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasCitation = await page.locator('.nene-corpus-chat__citation').first().isVisible().catch(() => false);

    if (response) {
      return {
        result: 'pass',
        note: hasCitation ? 'Response with citation rendered' : 'Response rendered (no citation)',
      };
    }
    const err = await page.locator('.nene-corpus-chat__error').textContent().catch(() => null);
    return { result: 'fail', note: `Chat response not received. Error: ${err ?? 'none'}` };
  } catch (e) {
    return { result: 'fail', note: `Chat failed: ${e instanceof Error ? e.message.slice(0, 80) : '?'}` };
  }
}

async function cpConversationLog(page: import('@playwright/test').Page): Promise<{ result: CheckpointResult; note: string }> {
  try {
    // Navigate back to admin
    await page.goto(ADMIN_URL);
    await page.locator('h2:has-text("Conversation logs")').waitFor({ timeout: 8000 });

    // Check that conversation logs section shows sessions
    const hasRows = await page.locator('tbody tr').first().isVisible({ timeout: 6000 }).catch(() => false);
    const hasEmpty = await page.locator('text=No chat sessions yet.').isVisible().catch(() => false);

    if (hasRows) {
      return { result: 'pass', note: 'Conversation log shows session rows' };
    }
    if (hasEmpty) {
      return { result: 'pass', note: 'Conversation log empty state shown correctly' };
    }
    return { result: 'fail', note: 'Conversation log section not showing expected content' };
  } catch (e) {
    return { result: 'fail', note: `Log check failed: ${e instanceof Error ? e.message.slice(0, 80) : '?'}` };
  }
}

async function cpLogout(page: import('@playwright/test').Page): Promise<{ result: CheckpointResult; note: string }> {
  try {
    await page.locator('header button:has-text("Sign out")').click();
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible({ timeout: 6000 });
    const stored = await page.evaluate(
      (key: string) => window.sessionStorage.getItem(key),
      ADMIN_TOKEN_KEY,
    );
    return {
      result: stored === null ? 'pass' : 'fail',
      note: stored === null ? 'Logged out, token cleared' : 'Logged out but token still in sessionStorage',
    };
  } catch (e) {
    return { result: 'fail', note: `Logout failed: ${e instanceof Error ? e.message.slice(0, 80) : '?'}` };
  }
}

// ── Test generation ───────────────────────────────────────────────────────────

for (const persona of PERSONAS) {
  test(`${persona.id} [${persona.industry}] ${persona.behavior}`, async ({ page }) => {
    await setupCommonMocks(page, persona);

    const record: ScenarioRecord = {
      personaId: persona.id,
      behavior: persona.behavior,
      industry: persona.industry,
      techLevel: persona.techLevel,
      checkpoints: {
        login: 'skip',
        llm_config: 'skip',
        source_upload: 'skip',
        widget_preview: 'skip',
        chat: 'skip',
        conversation_log: 'skip',
        logout: 'skip',
      },
      notes: [],
    };

    // CP1: Login
    const loginR = await cpLogin(page, persona);
    record.checkpoints.login = loginR.result;
    record.notes.push(`login: ${loginR.note}`);
    if (loginR.result === 'fail') {
      test.info().annotations.push({ type: 'scenario', description: JSON.stringify(record) });
      return;
    }

    // CP2: LLM Config
    const llmR = await cpLlmConfig(page, persona);
    record.checkpoints.llm_config = llmR.result;
    record.notes.push(`llm_config: ${llmR.note}`);
    // Don't abort for skip_llm / api_key_wrong_fmt — continue to observe downstream behavior

    // CP3: Source Upload
    const uploadR = await cpSourceUpload(page, persona);
    record.checkpoints.source_upload = uploadR.result;
    record.notes.push(`source_upload: ${uploadR.note}`);

    // CP4: Widget Preview
    const widgetR = await cpWidgetPreview(page, persona);
    record.checkpoints.widget_preview = widgetR.result as CheckpointResult;
    record.notes.push(`widget_preview: ${widgetR.note}`);

    // CP5: Chat
    if (widgetR.result === 'pass' || widgetR.result === 'partial') {
      const chatR = await cpChat(page, persona);
      record.checkpoints.chat = chatR.result as CheckpointResult;
      record.notes.push(`chat: ${chatR.note}`);
    }

    // CP6: Conversation Log
    const logR = await cpConversationLog(page);
    record.checkpoints.conversation_log = logR.result;
    record.notes.push(`conversation_log: ${logR.note}`);

    // CP7: Logout
    const logoutR = await cpLogout(page);
    record.checkpoints.logout = logoutR.result;
    record.notes.push(`logout: ${logoutR.note}`);

    // Attach full scenario record as annotation for post-processing
    test.info().annotations.push({ type: 'scenario', description: JSON.stringify(record) });

    // The test "passes" if the overall outcome matches the expected outcome.
    // Personas with expectedOutcome 'full' should reach logout successfully.
    if (persona.expectedOutcome === 'full') {
      const criticalPass =
        record.checkpoints.login === 'pass' &&
        record.checkpoints.logout === 'pass';
      expect(criticalPass).toBe(true);
    }
    // Partial/stuck personas are expected to hit friction — test passes regardless
    // so all 200 can run and produce data.
  });
}
