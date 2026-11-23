import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
        results: resolve(import.meta.dirname, 'results.html'),
        summary: resolve(import.meta.dirname, 'summary.html'),
      },
    },
  },
});
