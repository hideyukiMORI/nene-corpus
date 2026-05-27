/**
 * Category: Content Ingestion
 *
 * Tests the Upload Source panel: text mode and file mode (CSV/PDF)
 * including preview, column mapping, success, and error scenarios.
 */

import { test, expect } from '@playwright/test';
import {
  gotoAdminDashboardFast,
  mockDashboardDefaults,
} from '../fixtures/admin-helpers.js';
import {
  CSV_PREVIEW,
  PDF_PREVIEW,
  CREATE_SOURCE_RESULT,
  SOURCE_LIST_EMPTY,
  SESSION_LIST_EMPTY,
} from '../fixtures/admin-api-mocks.js';

test.describe('Content Ingestion', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminDashboardFast(page);
  });

  // ── Text mode ───────────────────────────────────────────────────────────────

  test('03-01: text mode — form renders with name + content fields', async ({ page }) => {
    await page.locator('button:has-text("Paste text")').click();

    await expect(page.locator('label:has-text("Source name")')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('03-02: text mode — submit without name shows validation error', async ({ page }) => {
    let ingestCalled = false;
    await page.route('**/admin/sources', (route) => {
      if (route.request().method() === 'POST') {
        ingestCalled = true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CREATE_SOURCE_RESULT) });
      }
      return route.continue();
    });

    await page.locator('button:has-text("Paste text")').click();
    // Fill content but leave name empty
    await page.locator('textarea').fill('Some text content');
    await page.locator('button:has-text("Ingest into corpus")').click();

    // Should show validation error, not call API
    await expect(page.locator('.text-red-600, [role="alert"]')).toBeVisible({ timeout: 4000 });
    expect(ingestCalled).toBe(false);
  });

  test('03-03: text mode — submit without content shows validation error', async ({ page }) => {
    let ingestCalled = false;
    await page.route('**/admin/sources', (route) => {
      if (route.request().method() === 'POST') {
        ingestCalled = true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CREATE_SOURCE_RESULT) });
      }
      return route.continue();
    });

    await page.locator('button:has-text("Paste text")').click();
    await page.locator('input[placeholder="Product catalog"]').fill('My Source');
    // Leave textarea empty
    await page.locator('button:has-text("Ingest into corpus")').click();

    await expect(page.locator('.text-red-600, [role="alert"]')).toBeVisible({ timeout: 4000 });
    expect(ingestCalled).toBe(false);
  });

  test('03-04: text mode — happy path, success message shown', async ({ page }) => {
    await page.route('**/admin/sources', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(CREATE_SOURCE_RESULT),
        });
      }
      return route.continue();
    });

    await page.locator('button:has-text("Paste text")').click();
    await page.locator('input[placeholder="Product catalog"]').fill('My FAQ');
    await page.locator('textarea').fill('This is the FAQ content for testing ingestion.');
    await page.locator('button:has-text("Ingest into corpus")').click();

    // Success message appears (text-emerald-700)
    await expect(page.locator('.text-emerald-700').first()).toBeVisible({
      timeout: 8000,
    });
  });

  test('03-05: text mode — API failure shows error message', async ({ page }) => {
    await page.route('**/admin/sources', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Ingestion failed.' }),
        });
      }
      return route.continue();
    });

    await page.locator('button:has-text("Paste text")').click();
    await page.locator('input[placeholder="Product catalog"]').fill('My FAQ');
    await page.locator('textarea').fill('Some content.');
    await page.locator('button:has-text("Ingest into corpus")').click();

    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 6000 });
  });

  // ── Mode switching ──────────────────────────────────────────────────────────

  test('03-06: mode toggle — switching File Upload ↔ Paste text clears fields', async ({
    page,
  }) => {
    // Start in text mode, fill some data
    await page.locator('button:has-text("Paste text")').click();
    await page.locator('input[placeholder="Product catalog"]').fill('Will be cleared');
    await page.locator('textarea').fill('Will be cleared');

    // Switch to file upload
    await page.locator('button:has-text("File upload")').click();
    // Switch back to text
    await page.locator('button:has-text("Paste text")').click();

    // Name field may or may not be cleared (depends on UX); textarea should be empty
    await expect(page.locator('textarea')).toHaveValue('');
  });

  // ── File mode — CSV ─────────────────────────────────────────────────────────

  test('03-07: file mode CSV preview — shows column headers and row count', async ({ page }) => {
    await page.route('**/admin/ingestion/csv/preview', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CSV_PREVIEW),
      }),
    );

    await page.locator('button:has-text("File upload")').click();

    // Set the file (Buffer approach for CSV)
    const csvContent = 'title,description,category\nProduct A,Desc A,Electronics\nProduct B,Desc B,Clothing';
    await page.locator('input[type="file"]').setInputFiles({
      name: 'catalog.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Auto-fills name from filename
    await expect(page.locator('input[placeholder="Product catalog"]')).toHaveValue('catalog');

    // Click preview
    await page.locator('button:has-text("Preview file")').click();

    // CSV preview shows row count and column headers
    await expect(page.locator('text=50 rows')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('th:has-text("title")').first()).toBeVisible();
  });

  test('03-08: file mode PDF preview — shows page count', async ({ page }) => {
    await page.route('**/admin/ingestion/pdf/preview', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PDF_PREVIEW),
      }),
    );

    await page.locator('button:has-text("File upload")').click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'manual.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 fake pdf content'),
    });

    await page.locator('button:has-text("Preview file")').click();
    await expect(page.locator('text=10 pages')).toBeVisible({ timeout: 8000 });
  });

  test('03-09: file mode CSV — preview error shown', async ({ page }) => {
    await page.route('**/admin/ingestion/csv/preview', (route) =>
      route.fulfill({ status: 400, contentType: 'application/json', body: '{"detail":"Invalid CSV"}' }),
    );

    await page.locator('button:has-text("File upload")').click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'bad.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('not,valid,,,,'),
    });
    await page.locator('button:has-text("Preview file")').click();

    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 6000 });
  });

  test('03-10: file mode — ingest success after CSV preview and column mapping', async ({
    page,
  }) => {
    await page.route('**/admin/ingestion/csv/preview', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CSV_PREVIEW) }),
    );
    await page.route('**/admin/sources', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(CREATE_SOURCE_RESULT),
        });
      }
      return route.continue();
    });

    await page.locator('button:has-text("File upload")').click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'catalog.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('title,description\nA,B'),
    });
    await page.locator('button:has-text("Preview file")').click();

    // Wait for preview to load
    await page.locator('text=50 rows').waitFor({ timeout: 8000 });

    // Select title column and at least one content column
    // Use select.nc-input to avoid matching the global Admin language select (nc-select nc-select-compact)
    const titleSelect = page.locator('select.nc-input').first();
    await titleSelect.selectOption('title');

    // Content columns fieldset (no value attr on checkboxes — scope by group role)
    // The same label "description" also appears in Metadata columns, so scope to Content columns fieldset
    const descCheckbox = page
      .getByRole('group', { name: /Content columns/i })
      .getByLabel('description');
    await descCheckbox.waitFor({ timeout: 4000 });
    await descCheckbox.check();

    await page.locator('button:has-text("Ingest into corpus")').click();
    await expect(page.locator('.text-emerald-700').first()).toBeVisible({
      timeout: 8000,
    });
  });

  // ── Additional coverage ─────────────────────────────────────────────────────

  test('03-11: file mode PDF — full ingest flow → success message', async ({ page }) => {
    await page.route('**/admin/ingestion/pdf/preview', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PDF_PREVIEW) }),
    );
    await page.route('**/admin/sources', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(CREATE_SOURCE_RESULT),
        });
      }
      return route.continue();
    });

    await page.locator('button:has-text("File upload")').click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'manual.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 fake pdf content for ingest test'),
    });
    await page.locator('button:has-text("Preview file")').click();
    await page.locator('text=10 pages').waitFor({ timeout: 8000 });

    // PDF ingest needs no column mapping — button should be enabled
    await page.locator('button:has-text("Ingest into corpus")').click();
    await expect(page.locator('.text-emerald-700').first()).toBeVisible({ timeout: 8000 });
  });

  test('03-12: unsupported file type (.docx) — error shown, no preview button', async ({
    page,
  }) => {
    await page.locator('button:has-text("File upload")').click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'report.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('fake docx content'),
    });

    // Preview button should not appear — unsupported type warning shown
    await expect(page.locator('.text-red-600').first()).toBeVisible({ timeout: 6000 });
    await expect(page.locator('button:has-text("Preview file")')).toHaveCount(0);
  });

  test('03-13: CSV — Ingest button disabled after unchecking all content columns', async ({
    page,
  }) => {
    await page.route('**/admin/ingestion/csv/preview', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CSV_PREVIEW) }),
    );

    await page.locator('button:has-text("File upload")').click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'catalog.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('title,description\nA,B'),
    });
    await page.locator('button:has-text("Preview file")').click();
    await page.locator('text=50 rows').waitFor({ timeout: 8000 });

    // After preview, columns are auto-selected → Ingest button enabled
    const ingestBtn = page.locator('button:has-text("Ingest into corpus")');
    await expect(ingestBtn).toBeEnabled({ timeout: 4000 });

    // Uncheck ALL content columns → Ingest button should become disabled
    const contentGroup = page.getByRole('group', { name: /Content columns/i });
    const contentCheckboxes = contentGroup.locator('input[type="checkbox"]');
    const count = await contentCheckboxes.count();
    for (let i = 0; i < count; i++) {
      if (await contentCheckboxes.nth(i).isChecked()) {
        await contentCheckboxes.nth(i).uncheck();
      }
    }

    await expect(ingestBtn).toBeDisabled({ timeout: 4000 });
  });
});
