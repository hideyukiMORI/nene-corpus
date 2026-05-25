import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
