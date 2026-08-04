import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));

// `jsdom` (the fleet default — nene-field / nene-payout / nene-vault
// `vitest.config.ts`) even though the API layer has no React components to
// render: plain Node's `fetch` requires an absolute URL, while every real
// call site here passes a relative path with `apiBase` defaulting to `''`
// (same-origin in the browser). jsdom supplies that origin
// (`http://localhost/`) so relative-path requests resolve the same way
// tests in the rest of the fleet do.
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(frontendRoot, 'src'),
      '@tests': resolve(frontendRoot, 'tests'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/vitest-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
