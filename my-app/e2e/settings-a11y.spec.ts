import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('threshold settings are saved and survive a reload', async ({ page }) => {
  await page.goto('/settings/');
  const lcpGood = page.locator('input[type="number"]').first();
  await lcpGood.fill('2000');
  await page.getByRole('button', { name: /Save/i }).click();
  await page.reload();
  await expect(page.locator('input[type="number"]').first()).toHaveValue('2000');
});

/**
 * Accessibility scan (WCAG 2.1 A/AA rules via axe-core).
 * Gate: no CRITICAL violations. Serious/moderate ones are attached to the
 * report for follow-up rather than failing the build.
 */
for (const path of ['/', '/audit/', '/settings/', '/about/']) {
  test(`accessibility: no critical violations on ${path}`, async ({ page }, testInfo) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const summary = results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
    await testInfo.attach('axe-violations.json', { body: JSON.stringify(summary, null, 2), contentType: 'application/json' });
    expect(summary.filter(v => v.impact === 'critical'), JSON.stringify(summary, null, 2)).toEqual([]);
  });
}
