import { test, expect } from '@playwright/test';

test('dashboard loads with primary actions', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Performance Audits' })).toBeVisible();
  await expect(page.getByRole('link', { name: /New Audit/ }).first()).toBeVisible();
});
