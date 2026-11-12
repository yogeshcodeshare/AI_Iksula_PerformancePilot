/** Manual "Retry failed" (retryFailedItems) — Day 4 fix for "URLs fail multiple times". */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryFailedItems } from './audit';
import type { AuditState } from '@/types';
import { psiResponse, jsonResponse, WEBDEV_FIELD } from '../../test/fixtures/psi';

let inFlight = 0;
let maxInFlight = 0;
let requested: string[] = [];

beforeEach(() => {
  inFlight = 0; maxInFlight = 0; requested = [];
  vi.useFakeTimers();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubEnv('NEXT_PUBLIC_PAGESPEED_API_KEY', 'test-key'); // would allow parallelism if code used it
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    const url = new URL(input).searchParams.get('url')!;
    requested.push(url);
    inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise(r => setTimeout(r, 1000));
    inFlight--;
    return jsonResponse(200, psiResponse({ url, field: WEBDEV_FIELD }));
  }));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

let n = 0;
function stateWith(failures: Array<{ code: string }>): AuditState {
  const pages = failures.map((_, i) => ({ pageId: `p${i}`, runId: 'r', pageLabel: `P${i}`, pageType: 'custom', url: `https://retry${++n}.test/`, sortOrder: i }));
  return {
    run: { runId: 'r' }, pages, metrics: [], categoryScores: [], diagnostics: [], cwvAssessments: [],
    pageFailures: failures.map((f, i) => ({ pageId: `p${i}`, pageLabel: `P${i}`, device: 'mobile', errorCode: f.code, errorMessage: 'x' })),
  } as unknown as AuditState;
}

async function retry(state: AuditState) {
  const p = retryFailedItems(state);
  await vi.runAllTimersAsync();
  return p;
}

describe('retryFailedItems', () => {
  it('retries transient failures one at a time (never in parallel)', async () => {
    const r = await retry(stateWith([{ code: 'timeout' }, { code: 'api-error' }, { code: 'rate-limit' }]));
    expect(r.pageFailures).toEqual([]);
    expect(requested).toHaveLength(3);
    expect(maxInFlight).toBe(1);
  });

  it('waits at least 30 s before the first retry', async () => {
    const p = retryFailedItems(stateWith([{ code: 'timeout' }]));
    await vi.advanceTimersByTimeAsync(29_000);
    expect(requested).toHaveLength(0);
    await vi.runAllTimersAsync();
    await p;
    expect(requested).toHaveLength(1);
  });

  it('does not retry quota / key errors, and keeps them in the failure list', async () => {
    const r = await retry(stateWith([{ code: 'quota-exhausted' }, { code: 'timeout' }]));
    expect(requested).toHaveLength(1); // only the timeout row
    expect(r.pageFailures.map(f => f.errorCode)).toEqual(['quota-exhausted']);
  });

  it('returns immediately when nothing is retryable', async () => {
    const r = await retry(stateWith([{ code: 'referer-blocked' }]));
    expect(requested).toHaveLength(0);
    expect(r.pageFailures).toHaveLength(1);
  });
});
