import { defineConfig, devices } from '@playwright/test';

// E2E specs are written on plan Day 5 (Thu 19 Nov). This config is the Day 1 foundation.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    // Test the real production output (static export in dist/), not `next dev`:
    // dev mode runs effects twice (React StrictMode), which starts every audit twice,
    // and compiles each page on first request (very slow). Run `npm run build` first.
    : { command: 'npm run serve:dist', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
