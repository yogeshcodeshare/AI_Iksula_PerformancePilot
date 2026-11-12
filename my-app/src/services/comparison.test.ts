import { describe, it, expect } from 'vitest';
import { compareReports, getSignificantChanges, generateComparisonSummary, normalizeUrl, matchPages } from './comparison';
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

describe('compareReports – noise threshold and summary', () => {
  it('treats tiny changes as unchanged (10% / min-absolute rule)', () => {
    const base = makeReport('A', [{ url: 'https://shop.test/', metrics: { LCP: 3000, CLS: 0.05 } }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/', metrics: { LCP: 3040, CLS: 0.055 } }]);
    const r = compareReports(base, cur);
    expect(r.deltas.find(d => d.metricName === 'LCP')?.deltaDirection).toBe('unchanged');
    expect(r.deltas.find(d => d.metricName === 'CLS')?.deltaDirection).toBe('unchanged');
  });

  it('lists pages only in the current run as new', () => {
    const base = makeReport('A', [{ url: 'https://shop.test/' }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/' }, { url: 'https://shop.test/plp', label: 'PLP', pageType: 'plp' }]);
    expect(compareReports(base, cur).newPages).toEqual(['PLP']);
  });

  it('summary counts add up', () => {
    const base = makeReport('A', [{ url: 'https://shop.test/', metrics: { LCP: 3000, FCP: 1500 } }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/', metrics: { LCP: 2000, FCP: 2500 } }]);
    const s = generateComparisonSummary(compareReports(base, cur));
    expect(s.totalCompared).toBe(10); // 5 metrics x 2 devices
    expect(s.improved + s.regressed + s.unchanged).toBe(10);
    expect(s.improved).toBe(2); // LCP on both devices
    expect(s.regressed).toBe(2); // FCP on both devices
  });

  it('lists the largest regression first', () => {
    const base = makeReport('A', [{ url: 'https://shop.test/', metrics: { LCP: 2000, FCP: 1000 } }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/', metrics: { LCP: 4000, FCP: 1500 } }]);
    const top = getSignificantChanges(compareReports(base, cur), 'regressed')[0];
    expect(top.metricName).toBe('LCP');
  });
});

// Checked on Day 2: deltaValue is stored as a magnitude, so improvements also
// sort biggest-first (an initial suspicion of a sort bug was ruled out).
describe('improvement ordering', () => {
  it('lists the largest improvement first', () => {
    const base = makeReport('A', [{ url: 'https://shop.test/', metrics: { LCP: 4000, FCP: 1500 } }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/', metrics: { LCP: 2000, FCP: 1000 } }]);
    const top = getSignificantChanges(compareReports(base, cur), 'improved')[0];
    expect(top.metricName).toBe('LCP'); // -2000 ms beats -500 ms
  });
});

/**
 * REGRESSION (user feedback: "compare feature does not work").
 * Reproduced on production on Day 1 as it.fails; fixed on Day 3 (B.2).
 */
describe('B.2 – compare matches the same page typed differently', () => {
  it('treats https://shop.test and https://shop.test/ as the same page', () => {
    const base = makeReport('A', [{ url: 'https://shop.test' }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/' }]);
    expect(compareReports(base, cur).missingPages).toEqual([]);
  });

  it('ignores www / tracking params when matching pages', () => {
    const base = makeReport('A', [{ url: 'https://www.shop.test/pdp' }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/pdp?utm_source=mail' }]);
    expect(compareReports(base, cur).deltas.length).toBeGreaterThan(0);
  });
});

describe('normalizeUrl', () => {
  it.each([
    ['https://web.dev', 'web.dev'],
    ['https://web.dev/', 'web.dev'],
    ['http://WWW.Web.Dev/', 'web.dev'],
    ['https://shop.test/pdp/?utm_source=mail&utm_medium=x#reviews', 'shop.test/pdp'],
    ['https://shop.test/search?q=shoes&gclid=abc', 'shop.test/search?q=shoes'],
    ['https://shop.test/list?sort=asc&page=2', 'shop.test/list?page=2&sort=asc'],
    ['shop.test/pdp', 'shop.test/pdp'],
  ])('%s -> %s', (input, expected) => expect(normalizeUrl(input)).toBe(expected));

  it('keeps different search queries apart', () => {
    expect(normalizeUrl('https://shop.test/search?q=shoes')).not.toBe(normalizeUrl('https://shop.test/search?q=bags'));
  });
});

describe('matchPages', () => {
  const page = (id: string, url: string, pageLabel: string, pageType = 'homepage') =>
    ({ pageId: id, runId: 'r', url, pageLabel, pageType, sortOrder: 0 }) as never;

  it('pairs the same URL even when page type changed (Homepage vs Bulk Add "custom")', () => {
    const r = matchPages([page('b1', 'https://web.dev/', 'Homepage', 'homepage')], [page('c1', 'https://web.dev', 'web.dev', 'custom')]);
    expect(r.pairs).toHaveLength(1);
    expect(r.unmatchedBaseline).toEqual([]);
  });

  it('falls back to label + type when the URL changed', () => {
    const r = matchPages([page('b1', 'https://old.shop.test/p/1', 'PDP', 'pdp')], [page('c1', 'https://shop.test/p/1', 'pdp', 'pdp')]);
    expect(r.pairs.map(([b, c]) => [b.pageId, c.pageId])).toEqual([['b1', 'c1']]);
  });

  it('never pairs one current page twice', () => {
    const r = matchPages(
      [page('b1', 'https://shop.test/', 'Home'), page('b2', 'https://shop.test', 'Home again')],
      [page('c1', 'https://shop.test/', 'Home')],
    );
    expect(r.pairs).toHaveLength(1);
    expect(r.unmatchedBaseline.map(p => p.pageId)).toEqual(['b2']);
  });
});

describe('compareReports – page type changed between runs', () => {
  it('still compares metrics', () => {
    const base = makeReport('A', [{ url: 'https://web.dev/', pageType: 'homepage' }]);
    const cur = makeReport('B', [{ url: 'https://web.dev', pageType: 'custom' }]);
    const r = compareReports(base, cur);
    expect(r.deltas).toHaveLength(10);
    expect(r.missingPages).toEqual([]);
    expect(r.newPages).toEqual([]);
  });
});
