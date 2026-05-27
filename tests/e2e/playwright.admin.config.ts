import { defineConfig, devices } from '@playwright/test';

/**
 * NeNe Corpus — Admin UI E2E Test Suite
 *
 * Tests the Admin SPA (/admin/) end-to-end.
 * All API calls are intercepted via page.route() — no real backend required.
 * The static build is served by the same Python HTTP server as the widget tests.
 */
export default defineConfig({
  testDir: './admin',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report-admin' }],
    ['json', { outputFile: 'playwright-report-admin/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3001',
    // Force English locale for consistent i18n-driven selectors
    locale: 'en-US',
    // Start each test with clean storage (no leaked tokens)
    storageState: { cookies: [], origins: [] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'python3 -m http.server 3001 --directory ../../public_html',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
