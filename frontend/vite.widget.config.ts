import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));

/**
 * Builds the embeddable `widget.js` (IIFE, self-contained) into `public_html/`.
 *
 * Kept separate from the admin build because the two ship to different places
 * under different rules: the admin bundle is a Tailwind SPA served from our own
 * `public_html/admin/`, while the widget is injected into a third-party page and
 * must therefore carry no Tailwind preflight and no admin code. See #361 §2.
 *
 *   npm run build:widget    # build
 *   npm run dev:widget      # dev server → http://localhost:5290/widget-dev.html
 */
export default defineConfig(({ mode }) => ({
  // Replace process.env.NODE_ENV at build time so the IIFE bundle works in
  // browsers that do not have a `process` global (all standard browsers).
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  plugins: [react()],
  // `public/` holds the admin SPA's favicons and .htaccess. A lib build has no
  // index.html to reference them, and outDir is public_html/ (emptyOutDir: false),
  // so copying them here would scatter admin assets across the web root.
  publicDir: false,
  resolve: {
    alias: {
      '@': resolve(frontendRoot, 'src'),
      '@tests': resolve(frontendRoot, 'tests'),
    },
  },
  server: {
    host: true,
    port: 5290,
    strictPort: true,
    proxy: {
      '/chat': 'http://localhost:8989',
      '/widget/appearance': 'http://localhost:8989',
      '/media': 'http://localhost:8989',
    },
  },
  build: {
    outDir: resolve(frontendRoot, '../public_html'),
    emptyOutDir: false,
    lib: {
      entry: resolve(frontendRoot, 'src/app/widget/main.tsx'),
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
