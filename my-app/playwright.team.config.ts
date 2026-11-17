import { defineConfig, devices } from '@playwright/test';

/**
 * Phase D: E2E for the team features (login, saved runs, compare from list,
 * error logging) against the dist-team build. Supabase is fully mocked by
 * e2e/team/supabaseMock.ts. Run `npm run build:team-e2e` first.
 */
export default defineConfig({
  testDir: './e2e/team',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report-team' }], ['list']],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npm run serve:dist-team', url: 'http://localhost:3001', reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
