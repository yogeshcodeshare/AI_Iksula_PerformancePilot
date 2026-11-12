import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { mockPageSpeed, startAudit, waitForCompletion, ok } from './helpers';

/**
 * Regression for the user-reported Compare bug (fixed Day 3):
 * baseline saved with "https://cmp.test" vs current "https://cmp.test/".
 */
test('Compare matches the same page typed differently and shows deltas', async ({ page }) => {
  // Current run: LCP 2400 ms
  await mockPageSpeed(page, url => ok(url, { LCP: 2400, INP: 150, CLS: 2, FCP: 1500, TTFB: 600 }));
  await startAudit(page, ['https://cmp.test/'], 'Compare Project');
  await waitForCompletion(page);
  await page.getByRole('link', { name: /View Results/i }).click();

  // Build a baseline from this run's own export, then change URL + make LCP slower
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /^JSON$/ }).click(),
  ]);
  const report = JSON.parse(await readFile((await download.path())!, 'utf-8'));
  report.pages = report.pages.map((p: { url: string }) => ({ ...p, url: 'https://cmp.test' }));
  report.metrics = report.metrics.map((m: { metricName: string; value: number }) =>
    m.metricName === 'LCP' ? { ...m, value: 4000 } : m);
  report.auditRun.auditLabel = 'Baseline without slash';

  await page.getByRole('button', { name: /Compare/ }).click();
  await page.getByLabel('Upload baseline JSON report').setInputFiles({
    name: 'baseline.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(report)),
  });

  const badge = page.getByRole('link', { name: /Comparing to:/ });
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute('href', /\/compare\/\?current=/);
  await badge.click();

  await expect(page.getByText('Baseline without slash')).toBeVisible();
  await expect(page.getByText(/Pages in baseline not in current/)).toHaveCount(0);
  await expect(page.getByText('IMPROVED', { exact: true }).first()).toBeVisible();
});

test('Compare rejects a file that is not a report', async ({ page }) => {
  await mockPageSpeed(page);
  await startAudit(page, ['https://cmp-bad.test/'], 'Compare Bad File');
  await waitForCompletion(page);
  await page.getByRole('link', { name: /View Results/i }).click();
  await page.getByRole('button', { name: /Compare/ }).click();
  await page.getByLabel('Upload baseline JSON report').setInputFiles({
    name: 'random.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":"world"}'),
  });
  await expect(page.getByRole('alert')).toContainText('not a PerformancePilot report');
});
