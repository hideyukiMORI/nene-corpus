import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { workspacePackageFullReload } from '../../vite.workspace-package-full-reload';

const appRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => ({
  // Replace process.env.NODE_ENV at build time so the IIFE bundle works in
  // browsers that do not have a `process` global (all standard browsers).
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  plugins: [react(), workspacePackageFullReload(appRoot)],
  resolve: {
    alias: {
      '@nene-corpus/api-client/appearance': resolve(appRoot, '../../packages/api-client/src/appearance.ts'),
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
    host: true,
    port: 5274,
    strictPort: true,
    watch: {
      ignored: ['**/node_modules/**', '!**/packages/**'],
    },
    proxy: {
      '/chat': 'http://localhost:8080',
      '/widget/appearance': 'http://localhost:8080',
      '/media': 'http://localhost:8080',
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
}));
