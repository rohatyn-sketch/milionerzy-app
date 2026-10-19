import { defineConfig } from '@playwright/test';

// Post-deploy smoke test against the live site (https://edufiszka.app).
// Run: pnpm --filter @milionerzy/frontend test:smoke
export default defineConfig({
  testDir: '.',
  timeout: 180_000,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list']],
  outputDir: '../test-results/smoke',
  use: { headless: true, trace: 'retain-on-failure' },
});
