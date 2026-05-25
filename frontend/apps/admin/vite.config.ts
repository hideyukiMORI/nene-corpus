import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const appRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@nene-corpus/api-client': resolve(appRoot, '../../packages/api-client/src/index.ts'),
      '@nene-corpus/tokens': resolve(appRoot, '../../packages/tokens/src/index.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@nene-corpus/api-client', '@nene-corpus/tokens'],
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/health': 'http://localhost:8080',
      '/admin': 'http://localhost:8080',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
