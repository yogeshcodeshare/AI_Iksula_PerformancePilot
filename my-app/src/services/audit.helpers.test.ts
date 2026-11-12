import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  parseRetryAfter, classifyHttpError, classifyFetchError, isComplete, extractMetrics,
  extractCategoryScores, extractDiagnostics, scoreToStatus, generateCWVAssessment,
  retryDelay, getPageConcurrency,
} from './audit';
import { psiResponse, WEBDEV_FIELD } from '../../test/fixtures/psi';
import quota429 from '../../test/fixtures/psi-429-quota.json';

afterEach(() => { vi.unstubAllEnvs(); });

describe('parseRetryAfter', () => {
  it('reads seconds', () => expect(parseRetryAfter('30')).toBe(30_000));
  it('caps long waits at 180 s', () => expect(parseRetryAfter('9999')).toBe(180_000));
  it('returns null when absent or garbage', () => {
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter('soon')).toBeNull();
  });
  it('reads an HTTP date in the future', () => {
    const inTen = new Date(Date.now() + 10_000).toUTCString();
    const ms = parseRetryAfter(inTen)!;
    expect(ms).toBeGreaterThan(8_000);
    expect(ms).toBeLessThanOrEqual(10_000);
  });
});

describe('classifyHttpError', () => {
  it('403 + referrer => referer-blocked', () =>
    expect(classifyHttpError(403, { error: { message: 'API_KEY_HTTP_REFERRER_BLOCKED' } }).code).toBe('referer-blocked'));
  it('403 other => permission-denied', () =>
    expect(classifyHttpError(403, { error: { message: 'API not enabled' } }).code).toBe('permission-denied'));
  it('real 429 "Queries per day" body from Google => quota-exhausted', () =>
    expect(classifyHttpError(429, quota429).code).toBe('quota-exhausted'));
  it('429 burst => rate-limit', () =>
    expect(classifyHttpError(429, { error: { message: 'Too many requests' } }).code).toBe('rate-limit'));
  it.each(['Lighthouse returned error: Something went wrong', 'NO_FCP', 'NO_DOCUMENT_REQUEST'])(
    '500 "%s" => psi-page-error', msg => expect(classifyHttpError(500, { error: { message: msg } }).code).toBe('psi-page-error'));
  it('503 generic => api-error', () =>
    expect(classifyHttpError(503, { error: { message: 'backend unavailable' } }).code).toBe('api-error'));
  it('400 / empty body => api-error with status in message', () => {
    const r = classifyHttpError(400, {});
    expect(r.code).toBe('api-error');
    expect(r.message).toContain('400');
  });
});

describe('classifyFetchError', () => {
  it('AbortError (our timeout) => timeout', () => {
    const e = new Error('aborted'); e.name = 'AbortError';
    expect(classifyFetchError(e).code).toBe('timeout');
  });
  it('Failed to fetch => network', () => expect(classifyFetchError(new TypeError('Failed to fetch')).code).toBe('network'));
  it('anything else => api-error', () => expect(classifyFetchError('boom').code).toBe('api-error'));
});

describe('isComplete', () => {
  it('true with URL-level CrUX', () => expect(isComplete(psiResponse({ field: WEBDEV_FIELD, lab: false }))).toBe(true));
  it('true with origin-level CrUX only', () => expect(isComplete(psiResponse({ origin: WEBDEV_FIELD, lab: false }))).toBe(true));
  it('true with lab data only', () => expect(isComplete(psiResponse({}))).toBe(true));
  it('false with nothing usable', () => expect(isComplete(psiResponse({ lab: false }))).toBe(false));
});

describe('extractMetrics', () => {
  it('URL-level CrUX: 5 CWV + performance score, no fallback flag', () => {
    const m = extractMetrics(psiResponse({ field: WEBDEV_FIELD }), 'p1', 'mobile', 'pagespeed', false);
    expect(m.map(x => x.metricName).sort()).toEqual(['CLS', 'FCP', 'INP', 'LCP', 'TTFB', 'performance_score']);
    expect(m.every(x => x.fallbackTriggered === false)).toBe(true);
    expect(m.find(x => x.metricName === 'LCP')).toMatchObject({ value: 3047, status: 'needs-improvement' });
    expect(m.find(x => x.metricName === 'FCP')?.status).toBe('poor');
    expect(m.find(x => x.metricName === 'performance_score')).toMatchObject({ value: 67, status: 'needs-improvement' });
  });

  it('CrUX CLS percentile 1 becomes 0.01 (never divided twice)', () => {
    const m = extractMetrics(psiResponse({ field: WEBDEV_FIELD }), 'p1', 'mobile', 'pagespeed', false);
    expect(m.find(x => x.metricName === 'CLS')?.value).toBe(0.01);
  });

  it('origin-level CrUX is flagged as fallback with a visible reason (transparency rule)', () => {
    const m = extractMetrics(psiResponse({ origin: WEBDEV_FIELD }), 'p1', 'mobile', 'pagespeed', true);
    const lcp = m.find(x => x.metricName === 'LCP')!;
    expect(lcp.fallbackTriggered).toBe(true);
    expect(lcp.fallbackReason).toMatch(/origin-level/i);
  });

  it('lab-only response uses Lighthouse values and marks fallback', () => {
    const m = extractMetrics(psiResponse({}), 'p1', 'desktop', 'pagespeed', false, 'No CrUX field data available for this URL');
    expect(m.find(x => x.metricName === 'LCP')).toMatchObject({ value: 2600, fallbackTriggered: true });
    expect(m.find(x => x.metricName === 'CLS')?.value).toBeCloseTo(0.175);
    expect(m.find(x => x.metricName === 'LCP')?.fallbackReason).toMatch(/No CrUX/);
  });

  it('returns [] when there is no data at all', () =>
    expect(extractMetrics(psiResponse({ lab: false }), 'p1', 'mobile', 'pagespeed', false)).toEqual([]));
});

describe('category scores & diagnostics', () => {
  it('extracts 4 Lighthouse categories as 0-100', () => {
    const s = extractCategoryScores(psiResponse({}), 'p1', 'mobile', 'pagespeed');
    const byCat = Object.fromEntries(s.map(x => [x.category, x.score]));
    expect(byCat).toEqual({ performance: 67, accessibility: 90, 'best-practices': 96, seo: 92 });
  });

  it('maps audits into categories via auditRefs, with pass/fail status', () => {
    const d = extractDiagnostics(psiResponse({}), 'p1', 'mobile', 'pagespeed');
    expect(d.length).toBeGreaterThan(0);
    const contrast = d.find(x => x.auditKey === 'color-contrast' || (x as { id?: string }).id === 'color-contrast');
    expect(contrast?.category).toBe('accessibility');
    expect(contrast?.status).toBe('fail');
  });

  it('scoreToStatus honours non-scored display modes', () => {
    expect(scoreToStatus(null, 'manual')).toBe('manual');
    expect(scoreToStatus(null, 'not-applicable')).toBe('not-applicable');
    expect(scoreToStatus(1, 'binary')).toBe('pass');
    expect(scoreToStatus(0, 'binary')).toBe('fail');
  });
});

describe('generateCWVAssessment', () => {
  it('fails CWV when any of LCP / INP / CLS is not good', () => {
    const m = extractMetrics(psiResponse({ field: WEBDEV_FIELD }), 'p1', 'mobile', 'pagespeed', false);
    const a = generateCWVAssessment(m, 'p1', 'mobile', 'pagespeed', false);
    expect(a.passed).toBe(false);
    expect(a.status).toBe('failed');
  });

  it('passes CWV when LCP, INP and CLS are all good', () => {
    const m = extractMetrics(psiResponse({ field: { LCP: 1800, INP: 120, CLS: 2, FCP: 900, TTFB: 400 } }), 'p1', 'mobile', 'pagespeed', false);
    const a = generateCWVAssessment(m, 'p1', 'mobile', 'pagespeed', false);
    expect(a.passed).toBe(true);
    expect(a.status).toBe('passed');
  });
});

describe('retry & concurrency policy', () => {
  it('retryDelay backs off 2 s, 4 s, 8 s and caps at 8 s', () => {
    expect([1, 2, 3, 4].map(retryDelay)).toEqual([2000, 4000, 8000, 8000]);
  });
  it('runs sequentially without an API key', () => {
    vi.stubEnv('NEXT_PUBLIC_PAGESPEED_API_KEY', '');
    expect(getPageConcurrency(20)).toBe(1);
  });
  it('scales 2/3/4/5 with an API key', () => {
    vi.stubEnv('NEXT_PUBLIC_PAGESPEED_API_KEY', 'test-key');
    expect([1, 8, 9, 15, 16, 25, 26].map(getPageConcurrency)).toEqual([2, 2, 3, 3, 4, 4, 5]);
  });
});
