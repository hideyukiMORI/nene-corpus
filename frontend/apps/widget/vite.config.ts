import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const appRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
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
    port: 5174,
    strictPort: true,
    proxy: {
      '/chat': 'http://localhost:8080',
    },
  },
  build: {
    outDir: resolve(__dirname, '../../../public_html'),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/main.tsx'),
      name: 'NeneCorpusWidget',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
        assetFileNames: 'widget.[ext]',
      },
    },
    cssCodeSplit: false,
  },
});
