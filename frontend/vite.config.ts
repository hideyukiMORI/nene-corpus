import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));
const adminOutDir = process.env.NENE_CORPUS_ADMIN_OUT
  ? resolve(frontendRoot, process.env.NENE_CORPUS_ADMIN_OUT)
  : resolve(frontendRoot, 'dist');

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(frontendRoot, 'src'),
      '@tests': resolve(frontendRoot, 'tests'),
    },
  },
  server: {
    host: true,
    port: 5289,
    strictPort: true,
    proxy: {
      '/health': 'http://localhost:8989',
      '/admin': 'http://localhost:8989',
      '/widget': 'http://localhost:8989',
      '/media': 'http://localhost:8989',
      '/guide': 'http://localhost:8989',
    },
  },
  build: {
    outDir: adminOutDir,
    emptyOutDir: true,
  },
});
