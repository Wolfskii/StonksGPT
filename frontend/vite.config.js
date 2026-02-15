import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  // Load .env from repo root (single file for backend + frontend)
  envDir: '..',
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: '/src/lib',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
