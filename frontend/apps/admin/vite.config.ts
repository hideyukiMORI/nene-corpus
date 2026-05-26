import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { workspacePackageFullReload } from '../../vite.workspace-package-full-reload';

const appRoot = fileURLToPath(new URL('.', import.meta.url));
const adminOutDir = process.env.NENE_CORPUS_ADMIN_OUT
  ? resolve(appRoot, process.env.NENE_CORPUS_ADMIN_OUT)
  : resolve(appRoot, 'dist');

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), workspacePackageFullReload(appRoot)],
  resolve: {
    alias: {
      '@nene-corpus/api-client/account': resolve(appRoot, '../../packages/api-client/src/account.ts'),
      '@nene-corpus/api-client/appearance': resolve(appRoot, '../../packages/api-client/src/appearance.ts'),
      '@nene-corpus/api-client/llm-settings': resolve(appRoot, '../../packages/api-client/src/llm-settings.ts'),
      '@nene-corpus/api-client/chat-settings': resolve(appRoot, '../../packages/api-client/src/chat-settings.ts'),
      '@nene-corpus/api-client/types': resolve(appRoot, '../../packages/api-client/src/types.ts'),
      '@nene-corpus/api-client': resolve(appRoot, '../../packages/api-client/src/index.ts'),
      '@nene-corpus/i18n': resolve(appRoot, '../../packages/i18n/src/index.ts'),
      '@nene-corpus/tokens': resolve(appRoot, '../../packages/tokens/src/index.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@nene-corpus/api-client', '@nene-corpus/i18n', '@nene-corpus/tokens'],
  },
  server: {
    port: 5273,
    strictPort: true,
    watch: {
      ignored: ['**/node_modules/**', '!**/packages/**'],
    },
    proxy: {
      '/health': 'http://localhost:8080',
      '/admin': 'http://localhost:8080',
      '/widget': 'http://localhost:8080',
      '/media': 'http://localhost:8080',
    },
  },
  build: {
    outDir: adminOutDir,
    emptyOutDir: true,
  },
});
