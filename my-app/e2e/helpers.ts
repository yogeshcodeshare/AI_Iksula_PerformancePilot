import { expect, type Page, type Route } from '@playwright/test';
import { psiResponse, psiError, WEBDEV_FIELD } from '../test/fixtures/psi';

/** Per-URL behaviour for the fake PageSpeed API. Default: 200 with web.dev-like data. */
export type PsiBehaviour = (url: string, strategy: string) => { status: number; body: unknown };

export const UNREACHABLE_MSG =
  'Lighthouse returned error: FAILED_DOCUMENT_REQUEST. Lighthouse was unable to reliably load the page you requested. ' +
  'Make sure you are testing the correct URL and that the server is properly responding to all requests. (Details: net::ERR_CONNECTION_FAILED)';

export const ok = (url: string, field = WEBDEV_FIELD) => ({ status: 200, body: psiResponse({ url, field }) });
export const unreachable = () => ({ status: 400, body: psiError(400, UNREACHABLE_MSG) });

/** Intercept every PageSpeed API call made by the browser. Returns the list of requested URLs. */
export async function mockPageSpeed(page: Page, behaviour: PsiBehaviour = url => ok(url)) {
  const requested: { url: string; strategy: string }[] = [];
  await page.route('**/pagespeedonline/v5/runPagespeed**', async (route: Route) => {
    const u = new URL(route.request().url());
    const url = u.searchParams.get('url') ?? '';
    const strategy = u.searchParams.get('strategy') ?? '';
    requested.push({ url, strategy });
    const { status, body } = url === 'https://www.google.com/' ? ok(url) : behaviour(url, strategy);
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  return requested;
}

/** Fill the New Audit form via Bulk Add and start the run. */
export async function startAudit(page: Page, urls: string[], project = 'E2E Project', label = 'E2E Run') {
  await page.goto('/audit/');
  await page.getByPlaceholder('e.g., E-commerce Core').fill(project);
  await page.getByPlaceholder('e.g., Q3 Performance Baseline').fill(label);
  await page.getByRole('button', { name: /Bulk Add/i }).click();
  await page.getByPlaceholder(/example\.com\/page1/).fill(urls.join('\n'));
  await page.getByRole('button', { name: 'Add URLs' }).click();
  await page.getByRole('button', { name: /Start Performance Audit/i }).click();
  await expect(page).toHaveURL(/\/audit\/progress\/?$/);
}

/** Wait until the run finishes and the results link is active. */
export async function waitForCompletion(page: Page) {
  await expect(page.getByRole('link', { name: /View Results/i })).toBeVisible({ timeout: 90_000 });
}
