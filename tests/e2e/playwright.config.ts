import { defineConfig, devices } from '@playwright/test';

/**
 * NeNe Corpus — Widget E2E Test Suite
 *
 * Serves the built widget from public_html/ via Python HTTP server.
 * All API calls (appearance, chat sessions, chat messages) are intercepted
 * and mocked via page.route() — no real backend or LLM is required.
 */
export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3001',
    // Force English locale so all i18n-driven selectors (aria-label etc.) are consistent.
    locale: 'en-US',
    // Start each test with a clean storage state (no sessionStorage tokens from previous tests)
    storageState: { cookies: [], origins: [] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 8000,
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
