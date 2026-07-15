import { defineConfig } from 'vitest/config';

// `jsdom` (the fleet default — nene-field / nene-payout / nene-vault
// `vitest.config.ts`) even though this package has no React components to
// render: plain Node's `fetch` requires an absolute URL, while every real
// call site here passes a relative path with `apiBase` defaulting to `''`
// (same-origin in the browser). jsdom supplies that origin
// (`http://localhost/`) so relative-path requests resolve the same way
// tests in the rest of the fleet do.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/vitest-setup.ts'],
    include: ['src/**/*.test.ts'],
  },
});
