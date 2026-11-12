import { describe, it, expect } from 'vitest';
import { compareReports } from './comparison';
import { makeReport } from '../../test/fixtures/reports';

describe('compareReports', () => {
  it('matches identical pages and marks a faster LCP as improved', () => {
    const base = makeReport('A', [{ url: 'https://shop.test/', metrics: { LCP: 3000 } }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/', metrics: { LCP: 2400 } }]);
    const r = compareReports(base, cur);
    const lcp = r.deltas.find(d => d.metricName === 'LCP' && d.device === 'mobile');
    expect(lcp?.deltaDirection).toBe('improved');
    expect(r.missingPages).toEqual([]);
  });

  it('marks a slower LCP as regressed', () => {
    const base = makeReport('A', [{ url: 'https://shop.test/', metrics: { LCP: 2400 } }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/', metrics: { LCP: 3600 } }]);
    const lcp = compareReports(base, cur).deltas.find(d => d.metricName === 'LCP' && d.device === 'mobile');
    expect(lcp?.deltaDirection).toBe('regressed');
  });

  it('lists pages only in the baseline as missing', () => {
    const base = makeReport('A', [{ url: 'https://shop.test/' }, { url: 'https://shop.test/pdp', label: 'PDP', pageType: 'pdp' }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/' }]);
    expect(compareReports(base, cur).missingPages).toContain('PDP');
  });
});

/**
 * BUG REPRODUCTION (user feedback: "compare feature does not work").
 * These document the current broken behaviour and are expected to FAIL today.
 * `it.fails` keeps the suite green; when the fix lands (plan Day 3 / B.2)
 * Vitest will report them as unexpectedly passing and they become normal `it` tests.
 */
describe('BUG B.2 – compare matches URLs too strictly', () => {
  it.fails('treats https://shop.test and https://shop.test/ as the same page', () => {
    const base = makeReport('A', [{ url: 'https://shop.test' }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/' }]);
    expect(compareReports(base, cur).missingPages).toEqual([]);
  });

  it.fails('ignores www / tracking params when matching pages', () => {
    const base = makeReport('A', [{ url: 'https://www.shop.test/pdp' }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/pdp?utm_source=mail' }]);
    expect(compareReports(base, cur).deltas.length).toBeGreaterThan(0);
  });
});
