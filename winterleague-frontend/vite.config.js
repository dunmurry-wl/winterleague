import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// public/winterleague.test.db holds dummy data for local testing; keep it off the live site.
const excludeTestDb = {
  name: 'exclude-test-db',
  apply: 'build',
  closeBundle() {
    rmSync(resolve(import.meta.dirname, 'dist/winterleague.test.db'), { force: true });
  },
};

export default defineConfig({
  // Served from https://dunmurry-wl.github.io/winterleague/
  base: '/winterleague/',
  plugins: [react(), excludeTestDb],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
});
