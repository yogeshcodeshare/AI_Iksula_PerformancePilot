/**
 * runAudit end-to-end with a mocked PageSpeed API (no network).
 * Covers the user-reported "URLs fail multiple times" area: error classes,
 * psi-page-error retries, and that one bad URL never aborts the batch.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runAudit } from './audit';
import type { AuditFormData } from '@/types';
import { psiResponse, jsonResponse, psiError, WEBDEV_FIELD } from '../../test/fixtures/psi';

const REAL = 'Lighthouse returned error: FAILED_DOCUMENT_REQUEST. Lighthouse was unable to reliably load the page you requested. Make sure you are testing the correct URL and that the server is properly responding to all requests. (Details: net::ERR_CONNECTION_FAILED)';

type Handler = (url: string, strategy: string) => Response | Promise<Response>;
let calls: { url: string; strategy: string }[] = [];
let uid = 0;

function mockPsi(handler: Handler) {
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    const u = new URL(input);
    const url = u.searchParams.get('url')!;
    const strategy = u.searchParams.get('strategy')!;
    calls.push({ url, strategy });
    if (url === 'https://www.google.com/') return jsonResponse(200, psiResponse({ url }));
    return handler(url, strategy);
  }));
}

/** Unique URLs per test so the module-level hourly PSI cache never leaks between tests. */
const u = (path: string) => `https://site${++uid}.test/${path}`;

const form = (urls: string[]): AuditFormData => ({
  projectName: 'Test', auditLabel: 'run', environment: 'production',
  pages: urls.map((url, i) => ({ pageLabel: `P${i}`, pageType: 'homepage', url })),
} as unknown as AuditFormData);

beforeEach(() => {
  calls = [];
  vi.useFakeTimers();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function run(urls: string[]) {
  const p = runAudit(form(urls));
  p.catch(() => {}); // avoid unhandled-rejection noise while timers advance
  await vi.runAllTimersAsync();
  return p;
}

describe('runAudit', () => {
  it('audits every page on mobile + desktop and returns metrics, scores, diagnostics', async () => {
    mockPsi(url => jsonResponse(200, psiResponse({ url, field: WEBDEV_FIELD })));
    const r = await run([u('a'), u('b')]);
    expect(r.pageFailures).toEqual([]);
    expect(r.pages).toHaveLength(2);
    expect(r.metrics.filter(m => m.metricName === 'LCP')).toHaveLength(4); // 2 pages x 2 devices
    expect(r.categoryScores.length).toBe(16);
    expect(r.cwvAssessments).toHaveLength(4);
    expect(new Set(calls.filter(c => c.url !== 'https://www.google.com/').map(c => c.strategy))).toEqual(new Set(['mobile', 'desktop']));
  });

  it('stops before auditing when the API key is referer-blocked (preflight)', async () => {
    // Fresh module: the in-memory hourly PSI cache would otherwise replay an
    // earlier successful google.com preflight (see Day 2 finding).
    vi.resetModules();
    const fresh = await import('./audit');
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(403, psiError(403, 'Requests from referer are blocked. API_KEY_HTTP_REFERRER_BLOCKED'))));
    const p = fresh.runAudit(form([u('a')]));
    p.catch(() => {});
    await vi.runAllTimersAsync();
    await expect(p).rejects.toMatchObject({ errorCode: 'preflight-failed', underlyingCode: 'referer-blocked' });
    expect(calls).toEqual([]); // no user URL was ever requested
  });

  it('one failing URL does not abort the batch; failure is recorded with its error code', async () => {
    const bad = u('bad'); const good = u('good');
    mockPsi(url => url === bad
      ? jsonResponse(400, psiError(400, 'Lighthouse returned error: FAILED_DOCUMENT_REQUEST. Lighthouse was unable to reliably load the page you requested. Make sure you are testing the correct URL and that the server is properly responding to all requests. (Details: net::ERR_CONNECTION_FAILED)'))
      : jsonResponse(200, psiResponse({ url, field: WEBDEV_FIELD })));
    const r = await run([bad, good]);
    expect(r.metrics.some(m => r.pages.find(p => p.url === good)?.pageId === m.pageId)).toBe(true);
    const failed = r.pageFailures.filter(f => r.pages.find(p => p.pageId === f.pageId)?.url === bad);
    expect(failed.length).toBeGreaterThan(0);
    expect(failed[0].errorCode).toBe('page-unreachable');
  });

  it('psi-page-error (HTTP 500 "Something went wrong") is retried and recovers', async () => {
    const flaky = u('flaky');
    let attempts = 0;
    mockPsi((url, strategy) => {
      if (url === flaky && strategy === 'mobile' && attempts++ < 2) {
        return jsonResponse(500, psiError(500, 'Lighthouse returned error: Something went wrong.'));
      }
      return jsonResponse(200, psiResponse({ url, field: WEBDEV_FIELD }));
    });
    const r = await run([flaky]);
    expect(r.pageFailures).toEqual([]);
    expect(r.metrics.filter(m => m.device === 'mobile' && m.metricName === 'LCP')).toHaveLength(1);
    expect(attempts).toBe(3); // original + 2 retries
  });

  it('psi-page-error that never recovers is reported, not hung', async () => {
    const dead = u('dead');
    mockPsi(url => url === dead
      ? jsonResponse(500, psiError(500, 'Lighthouse returned error: NO_FCP'))
      : jsonResponse(200, psiResponse({ url, field: WEBDEV_FIELD })));
    const r = await run([dead]);
    expect(r.pageFailures.length).toBeGreaterThan(0);
    expect(r.pageFailures.every(f => f.errorCode === 'psi-page-error')).toBe(true);
  });

  it('second pass: a URL that fails under load is retried automatically and recovers', async () => {
    const busy = u('busy');
    let busyCalls = 0;
    mockPsi((url, strategy) => {
      if (url === busy && strategy === 'mobile' && busyCalls++ === 0) {
        return jsonResponse(503, psiError(503, 'Backend Error')); // api-error: Google-side
      }
      return jsonResponse(200, psiResponse({ url, field: WEBDEV_FIELD }));
    });
    const r = await run([busy, u('ok')]);
    expect(r.pageFailures).toEqual([]);
    expect(busyCalls).toBe(2); // original + one automatic second-pass call
    expect(r.metrics.filter(m => m.metricName === 'LCP')).toHaveLength(4);
  });

  it('unreachable site (real Google message, Day 4 scenario test) is not retried', async () => {
    const dead = u('nxdomain');
    let n = 0;
    mockPsi(url => {
      if (url === dead) { n++; return jsonResponse(400, psiError(400, REAL)); }
      return jsonResponse(200, psiResponse({ url, field: WEBDEV_FIELD }));
    });
    const r = await run([dead]);
    expect(n).toBe(2); // one call per device, no second pass
    expect(r.pageFailures.map(f => f.errorCode)).toEqual(['page-unreachable', 'page-unreachable']);
  });

  it('second pass is not attempted for quota errors (they cannot recover today)', async () => {
    const q = u('quota');
    let qCalls = 0;
    mockPsi(url => {
      if (url === q) { qCalls++; return jsonResponse(429, psiError(429, "Quota exceeded for quota metric 'Queries' and limit 'Queries per day'")); }
      return jsonResponse(200, psiResponse({ url, field: WEBDEV_FIELD }));
    });
    const r = await run([q]);
    expect(qCalls).toBe(1);
    expect(r.pageFailures.every(f => f.errorCode === 'quota-exhausted')).toBe(true);
  });

  it('preflight always calls Google (never served from the hourly cache)', async () => {
    mockPsi(url => jsonResponse(200, psiResponse({ url, field: WEBDEV_FIELD })));
    await run([u('a')]);
    await run([u('b')]);
    expect(calls.filter(c => c.url === 'https://www.google.com/')).toHaveLength(2);
  });

  it('a request that never answers is timed out and reported as timeout', async () => {
    const slow = u('slow');
    vi.stubGlobal('fetch', vi.fn((input: string, init?: RequestInit) => {
      const url = new URL(input).searchParams.get('url');
      if (url === 'https://www.google.com/') return Promise.resolve(jsonResponse(200, psiResponse({ url })));
      return new Promise((_, reject) => init?.signal?.addEventListener('abort', () => {
        const e = new Error('aborted'); e.name = 'AbortError'; reject(e);
      }));
    }));
    const r = await run([slow]);
    expect(r.pageFailures.length).toBeGreaterThan(0);
    expect(r.pageFailures.every(f => f.errorCode === 'timeout')).toBe(true);
  });
});
