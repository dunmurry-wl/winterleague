import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import databaseAsset from './tooling/databaseAsset.js';

export default defineConfig({
  // Served from https://dunmurry-wl.github.io/winterleague/
  base: '/winterleague/',
  plugins: [react(), databaseAsset()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
});
