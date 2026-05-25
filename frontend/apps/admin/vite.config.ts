import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
