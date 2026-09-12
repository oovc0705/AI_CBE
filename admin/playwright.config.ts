import { defineConfig, devices } from '@playwright/test';

/**
 * E2E smoke tests for cross-border e-commerce Admin panel.
 *
 * Prerequisites:
 *   1. Backend running on http://localhost:8080
 *   2. Admin dev server running on http://localhost:8000
 *   3. Test data seeded via scripts/seed-test-data.ts
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30_000,

  use: {
    baseURL: process.env.ADMIN_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use system Chrome if Playwright browsers not installed
        channel: 'chrome',
      },
    },
  ],

  webServer: process.env.CI
    ? undefined // In CI, servers are started separately
    : undefined, // In dev, start manually: npm run dev
});
