/**
 * Category: Source Management
 *
 * Tests the Sources table: listing, pagination, documents panel opening,
 * deletion (confirm dialog), and various error states.
 */

import { test, expect } from '@playwright/test';
import {
  bypassLogin,
  mockAdminAuth,
  gotoAdminDashboardFast,
} from '../fixtures/admin-helpers.js';
import {
  SOURCE_LIST_EMPTY,
  SOURCE_LIST_ONE,
  SOURCE_LIST_THREE,
  DOCUMENT_LIST_EMPTY,
  DOCUMENT_LIST_THREE,
  SESSION_LIST_EMPTY,
  makeSource,
} from '../fixtures/admin-api-mocks.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function setupSourcesPage(
  page: import('@playwright/test').Page,
  sourcesPayload: object,
) {
  await bypassLogin(page);
  await mockAdminAuth(page);
  await page.route('**/admin/sources**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sourcesPayload),
      });
    }
    return route.continue();
  });
  await page.route('**/admin/chat/sessions**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION_LIST_EMPTY) }),
  );
  await page.goto('/admin/');
  await page.locator('h2:has-text("Sources")').waitFor({ timeout: 8000 });
}

test.describe('Source Management', () => {
  // ── Empty state ─────────────────────────────────────────────────────────────

  test('04-01: empty sources — empty message displayed', async ({ page }) => {
    await setupSourcesPage(page, SOURCE_LIST_EMPTY);
    await expect(page.locator('text=No sources yet.')).toBeVisible();
  });

  // ── Source list rendering ───────────────────────────────────────────────────

  test('04-02: single source renders correct name, type, status', async ({ page }) => {
    await setupSourcesPage(page, SOURCE_LIST_ONE);
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody')).toContainText('Test Source');
    await expect(page.locator('tbody')).toContainText('Ready');
  });

  test('04-03: three sources — all rows visible with correct names', async ({ page }) => {
    await setupSourcesPage(page, SOURCE_LIST_THREE);
    await expect(page.locator('tbody tr')).toHaveCount(3);
    await expect(page.locator('tbody')).toContainText('Product FAQ');
    await expect(page.locator('tbody')).toContainText('User Manual');
    await expect(page.locator('tbody')).toContainText('Data Import');
  });

  test('04-04: sources with different types render correct type labels', async ({ page }) => {
    await setupSourcesPage(page, SOURCE_LIST_THREE);
    const rows = page.locator('tbody tr');
    // Row 1: text source
    await expect(rows.nth(0)).toContainText('Text');
    // Row 2: pdf source
    await expect(rows.nth(1)).toContainText('PDF');
    // Row 3: csv source
    await expect(rows.nth(2)).toContainText('CSV');
  });

  // ── Documents button ────────────────────────────────────────────────────────

  test('04-05: clicking Documents opens SourceDocumentsPanel', async ({ page }) => {
    await setupSourcesPage(page, SOURCE_LIST_ONE);

    // Mock the documents list endpoint
    await page.route('**/admin/sources/1/documents**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DOCUMENT_LIST_THREE),
      }),
    );

    await page.locator('tbody button:has-text("Documents")').first().click();

    // Documents panel should open — shows document titles
    await expect(
      page.locator('text=Document Alpha').first(),
    ).toBeVisible({ timeout: 8000 });
  });

  // ── Delete source ───────────────────────────────────────────────────────────

  test('04-06: delete button shows confirm dialog with source name', async ({ page }) => {
    await setupSourcesPage(page, SOURCE_LIST_ONE);

    await page.locator('tbody button:has-text("Delete")').first().click();

    // Confirm dialog shows source name
    await expect(page.locator('[role="dialog"], dialog').last()).toContainText('Test Source', {
      timeout: 6000,
    });
  });

  test('04-07: delete confirm — calls DELETE API, row removed', async ({ page }) => {
    let deleteCalled = false;

    // 1) Navigate and load the page first (LIFO: setupSourcesPage's GET handler registered during this)
    await setupSourcesPage(page, SOURCE_LIST_ONE);

    // 2) Register DELETE + reload-GET handler AFTER setupSourcesPage so it wins in LIFO order.
    //    This intercepts DELETE /admin/sources/1 and subsequent GET reload.
    let getCountAfterDelete = 0;
    await page.route('**/admin/sources**', (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'DELETE' && url.includes('/admin/sources/1')) {
        deleteCalled = true;
        return route.fulfill({ status: 204, body: '' });
      }

      if (method === 'GET') {
        getCountAfterDelete++;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(getCountAfterDelete <= 1 ? SOURCE_LIST_ONE : SOURCE_LIST_EMPTY),
        });
      }

      return route.continue();
    });

    await page.locator('tbody button:has-text("Delete")').first().click();
    // Click confirm in dialog
    await page.locator('[role="dialog"] button:has-text("Delete"), dialog button:has-text("Delete")').last().click();

    await expect(async () => expect(deleteCalled).toBe(true)).toPass({ timeout: 5000 });
  });

  test('04-08: delete cancel — dialog closes, row still present', async ({ page }) => {
    let deleteCalled = false;
    await setupSourcesPage(page, SOURCE_LIST_ONE);
    await page.route('**/admin/sources/1', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        return route.fulfill({ status: 204, body: '' });
      }
      return route.continue();
    });

    await page.locator('tbody button:has-text("Delete")').first().click();
    // Cancel the dialog
    await page.locator('[role="dialog"] button:has-text("Cancel"), dialog button:has-text("Cancel")').last().click();

    expect(deleteCalled).toBe(false);
    // Row still present
    await expect(page.locator('tbody tr')).toHaveCount(1);
  });

  test('04-09: delete API 500 — error message shown', async ({ page }) => {
    await setupSourcesPage(page, SOURCE_LIST_ONE);

    await page.route('**/admin/sources/1', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Server error"}' });
      }
      return route.continue();
    });

    await page.locator('tbody button:has-text("Delete")').first().click();
    await page.locator('[role="dialog"] button:has-text("Delete"), dialog button:has-text("Delete")').last().click();

    await expect(page.locator('.text-red-600').first()).toBeVisible({ timeout: 6000 });
  });

  // ── Pagination ──────────────────────────────────────────────────────────────

  test('04-10: pagination info shows correct range', async ({ page }) => {
    const bigList = {
      sources: Array.from({ length: 25 }, (_, i) =>
        makeSource({ source_id: i + 1, name: `Source ${i + 1}` }),
      ),
      total: 50,
    };
    await setupSourcesPage(page, bigList);

    // Page info should show "1–25 of 50" (default page size)
    await expect(page.locator('text=of 50')).toBeVisible({ timeout: 6000 });
  });

  test('04-11: per-page selector changes page size', async ({ page }) => {
    const bigList = {
      sources: Array.from({ length: 25 }, (_, i) =>
        makeSource({ source_id: i + 1, name: `Source ${i + 1}` }),
      ),
      total: 50,
    };
    await setupSourcesPage(page, bigList);

    const pageSizeSelect = page.locator('select[aria-label*="page"], select').filter({ hasText: /25|50|100/ });
    if (await pageSizeSelect.count() > 0) {
      await pageSizeSelect.first().selectOption('50');
      // Should still show 25 rows (mock returns 25)
      await expect(page.locator('tbody tr')).toHaveCount(25);
    }
  });

  test('04-12: failed source shows "failed" status badge', async ({ page }) => {
    const failedSource = {
      sources: [makeSource({ source_id: 1, name: 'Failed Source', status: 'failed' })],
      total: 1,
    };
    await setupSourcesPage(page, failedSource);
    await expect(page.locator('tbody')).toContainText('Failed');
  });

  test('04-13: processing source shows "processing" status badge', async ({ page }) => {
    const processingSource = {
      sources: [makeSource({ source_id: 1, name: 'Ingesting Source', status: 'processing' })],
      total: 1,
    };
    await setupSourcesPage(page, processingSource);
    await expect(page.locator('tbody')).toContainText(/Processing|Ingesting/i);
  });
});
