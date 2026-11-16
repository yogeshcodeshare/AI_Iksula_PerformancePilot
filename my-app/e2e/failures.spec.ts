import { test, expect } from '@playwright/test';
import { mockPageSpeed, startAudit, ok, unreachable } from './helpers';

/** Regression for the Day 4 fixes ("URLs fail multiple times"). */
test('unreachable URL is labelled clearly, not retried, and can be reported on GitHub', async ({ page }) => {
  const calls = await mockPageSpeed(page, url => (url.includes('no-such-domain') ? unreachable() : ok(url)));
  await startAudit(page, ['https://good.test/', 'https://no-such-domain.test/']);

  await expect(page.getByText(/Completed with \d+ issue/)).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText('Site unreachable', { exact: false }).first()).toBeVisible();

  // one call per device, no automatic second pass for a wrong URL
  expect(calls.filter(c => c.url.includes('no-such-domain'))).toHaveLength(2);

  const report = page.getByRole('link', { name: 'Report on GitHub' });
  await expect(report).toBeVisible();
  const href = await report.getAttribute('href');
  const q = new URL(href!).searchParams;
  expect(href).toContain('/issues/new?');
  expect(q.get('title')).toContain('page-unreachable');
  expect(q.get('body')).toContain('https://no-such-domain.test/');
});

test('New Audit form blocks start when required fields are missing', async ({ page }) => {
  await page.goto('/audit/');
  await page.getByRole('button', { name: /Start Performance Audit/i }).click();
  await expect(page.getByText('Project name is required')).toBeVisible();
  await expect(page).toHaveURL(/\/audit\/?$/);
});
