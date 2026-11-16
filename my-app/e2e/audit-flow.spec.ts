import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { mockPageSpeed, startAudit, waitForCompletion } from './helpers';

test.describe('Audit journey (PageSpeed mocked)', () => {
  test('configure → run → results → JSON export', async ({ page }) => {
    const calls = await mockPageSpeed(page);
    await startAudit(page, ['https://shop.test/', 'https://shop.test/pdp']);

    await expect(page.getByText(/AUDIT COMPLETE|COMPLETED/i).first()).toBeVisible({ timeout: 90_000 });
    await waitForCompletion(page);

    // mobile + desktop for both pages (+ the preflight call)
    const userCalls = calls.filter(c => c.url !== 'https://www.google.com/');
    expect(userCalls).toHaveLength(4);
    expect(new Set(userCalls.map(c => c.strategy))).toEqual(new Set(['mobile', 'desktop']));

    await page.getByRole('link', { name: /View Results/i }).click();
    await expect(page).toHaveURL(/\/results\/?\?runId=/);
    await expect(page.getByRole('heading', { name: 'E2E Project' })).toBeVisible();
    await expect(page.getByText('Detailed Results Matrix', { exact: false })).toBeVisible();
    await expect(page.getByText('shop.test/pdp', { exact: false }).first()).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /^JSON$/ }).click(),
    ]);
    const json = JSON.parse(await readFile((await download.path())!, 'utf-8'));
    expect(json.pages).toHaveLength(2);
    expect(json.metrics.length).toBeGreaterThan(0);
  });

  test('dashboard lists the finished audit', async ({ page }) => {
    await mockPageSpeed(page);
    await startAudit(page, ['https://dash.test/'], 'Dashboard Check');
    await waitForCompletion(page);
    await page.goto('/');
    await expect(page.getByText('Dashboard Check')).toBeVisible();
  });
});
