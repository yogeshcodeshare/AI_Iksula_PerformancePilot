import { test, expect } from '@playwright/test';
import { mockPageSpeed, startAudit, waitForCompletion, ok, unreachable } from '../helpers';
import { mockSupabase, loginAs, QA, OTHER } from './supabaseMock';

/**
 * Phase D: team features end to end, with Supabase mocked (dist-team build).
 * Covers login, auto-save of runs, team history, compare from the list,
 * delete-own-only, error logging for guests and QA, and the Failures page.
 */

test('login: wrong password shows a friendly error; correct password logs in', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/login/');
  await page.getByLabel('Work email').fill('qa.tester@iksula.com');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Email or password is incorrect.')).toBeVisible();

  await page.getByLabel('Password').fill('correct-password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: 'qa.tester@iksula.com' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('link', { name: 'Team login' })).toBeVisible();
});

test('login refuses a non-Iksula email without calling Supabase', async ({ page }) => {
  const db = await mockSupabase(page);
  await page.goto('/login/');
  await page.getByLabel('Work email').fill('someone@gmail.com');
  await page.getByLabel('Password').fill('correct-password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText(/@iksula\.com/).first()).toBeVisible();
  expect(db.requests.filter(r => r.path.startsWith('/auth/v1/token'))).toHaveLength(0);
});

test('guest: a failed URL is logged anonymously; no runs are saved; no team UI', async ({ page }) => {
  const db = await mockSupabase(page);
  await mockPageSpeed(page, url => (url.includes('no-such') ? unreachable() : ok(url)));
  await startAudit(page, ['https://good.test/', 'https://no-such.test/']);
  await expect(page.getByText(/Completed with \d+ issue/)).toBeVisible({ timeout: 90_000 });

  await expect.poll(() => db.failures.length).toBeGreaterThan(0);
  expect(db.failures.every(f => f.error_code === 'page-unreachable' && f.user_email === null && typeof f.guest_session === 'string')).toBe(true);
  expect(db.requests.some(r => r.path.startsWith('/rest/v1/audit_runs') && r.method === 'POST')).toBe(false);

  await page.goto('/');
  await expect(page.getByRole('tablist', { name: 'Whose audits' })).toHaveCount(0);
  await page.goto('/failures/');
  await expect(page.getByText(/error log is available to the Iksula QA team/)).toBeVisible();
});

test('QA: finished audits are saved, listed, compared from the list, and only own runs can be deleted', async ({ page }) => {
  // A team-mate's run already exists
  const db = await mockSupabase(page);
  await loginAs(page, QA);
  await mockPageSpeed(page, url => ok(url, { LCP: 2400, INP: 150, CLS: 2, FCP: 1500, TTFB: 600 }));

  // Two runs by this QA member
  await startAudit(page, ['https://shop.test/'], 'Shop', 'Release 1');
  await waitForCompletion(page);
  await expect.poll(() => db.runs.length).toBe(1);
  await startAudit(page, ['https://shop.test/'], 'Shop', 'Release 2');
  await waitForCompletion(page);
  await expect.poll(() => db.runs.length).toBe(2);
  expect(db.runs.every(r => r.created_by === QA.id && r.created_by_email === QA.email)).toBe(true);

  db.runs.push({ ...db.runs[0], id: '11111111-1111-4111-8111-111111111111', audit_label: 'Their run', created_by: OTHER.id, created_by_email: OTHER.email });

  await page.goto('/');
  await expect(page.getByRole('tablist', { name: 'Whose audits' })).toBeVisible();
  await expect(page.getByText('Release 1')).toBeVisible();
  await expect(page.getByText('Release 2')).toBeVisible();
  await expect(page.getByText('Their run')).toHaveCount(0); // "My audits" only

  await page.getByRole('tab', { name: 'Team audits' }).click();
  await expect(page.getByText('Their run')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete Shop Their run' })).toHaveCount(0); // not mine

  // Compare the two saved runs straight from the list
  await page.getByRole('checkbox', { name: 'Select Shop Release 1' }).check();
  await page.getByRole('checkbox', { name: 'Select Shop Release 2' }).check();
  await page.getByRole('button', { name: /Compare selected \(2\/2\)/ }).click();
  await expect(page).toHaveURL(/\/compare\/\?baseline=.+&current=/);
  await expect(page.getByText(/metrics compared/)).toBeVisible();
  await expect(page.getByTestId('before-after-chart')).toBeVisible();
});

test('QA: Failures page shows logged failures with who hit them', async ({ page }) => {
  await mockSupabase(page, {
    failures: [
      { id: 'f1', created_at: new Date().toISOString(), url: 'https://slow.test/', device: 'mobile', error_code: 'timeout', message: 'Timed out', phase: 'run', user_email: null, guest_session: 'guest-abc-123' },
      { id: 'f2', created_at: new Date().toISOString(), url: 'https://down.test/', device: 'desktop', error_code: 'page-unreachable', message: 'unreachable', phase: 'run', user_email: QA.email, guest_session: null },
    ],
  });
  await loginAs(page, QA);
  await page.goto('/failures/');
  await expect(page.getByText('https://slow.test/').first()).toBeVisible();
  await expect(page.getByText('https://down.test/').first()).toBeVisible();
  await expect(page.getByText(QA.email).first()).toBeVisible();
});
