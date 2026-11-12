import type { PageSpeedResponse } from '@/services/audit';

type CruxValues = { LCP?: number; INP?: number; CLS?: number; FCP?: number; TTFB?: number };

const crux = (v: CruxValues) => ({
  metrics: {
    ...(v.LCP !== undefined && { LARGEST_CONTENTFUL_PAINT_MS: { percentile: v.LCP, category: 'AVERAGE' } }),
    ...(v.INP !== undefined && { INTERACTION_TO_NEXT_PAINT: { percentile: v.INP, category: 'AVERAGE' } }),
    // CrUX reports CLS percentile scaled by 100 (1 => 0.01)
    ...(v.CLS !== undefined && { CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: v.CLS, category: 'FAST' } }),
    ...(v.FCP !== undefined && { FIRST_CONTENTFUL_PAINT_MS: { percentile: v.FCP, category: 'SLOW' } }),
    ...(v.TTFB !== undefined && { EXPERIMENTAL_TIME_TO_FIRST_BYTE: { percentile: v.TTFB, category: 'AVERAGE' } }),
  },
});

const audit = (id: string, title: string, score: number | null, numericValue?: number, mode = 'numeric') => ({
  id, title, description: `${title} description`, score, scoreDisplayMode: mode,
  ...(numericValue !== undefined && { numericValue, displayValue: String(numericValue) }),
});

/** Lighthouse lab section modelled on the 12 Nov 2026 web.dev mobile run. */
export function labResult(perfScore = 0.67) {
  const audits = Object.fromEntries([
    audit('largest-contentful-paint', 'Largest Contentful Paint', 0.8, 2600),
    audit('first-contentful-paint', 'First Contentful Paint', 0.7, 2600),
    audit('total-blocking-time', 'Total Blocking Time', 0.3, 710),
    audit('cumulative-layout-shift', 'Cumulative Layout Shift', 0.6, 0.175),
    audit('server-response-time', 'Initial server response time', 1, 120),
    audit('speed-index', 'Speed Index', 0.6, 3900),
    audit('unused-javascript', 'Reduce unused JavaScript', 0.2, 450, 'metricSavings'),
    audit('color-contrast', 'Background and foreground colors have sufficient contrast', 0, undefined, 'binary'),
    audit('is-on-https', 'Uses HTTPS', 1, undefined, 'binary'),
    audit('meta-description', 'Document has a meta description', 1, undefined, 'binary'),
  ].map(a => [a.id, a]));
  const cat = (id: string, title: string, score: number, refs: string[]) => ({
    id, title, score, auditRefs: refs.map(r => ({ id: r, weight: 1 })),
  });
  return {
    audits,
    categories: {
      performance: cat('performance', 'Performance', perfScore,
        ['largest-contentful-paint', 'first-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index', 'server-response-time', 'unused-javascript']),
      accessibility: cat('accessibility', 'Accessibility', 0.9, ['color-contrast']),
      'best-practices': cat('best-practices', 'Best Practices', 0.96, ['is-on-https']),
      seo: cat('seo', 'SEO', 0.92, ['meta-description']),
    },
  };
}

export const WEBDEV_FIELD: CruxValues = { LCP: 3047, INP: 235, CLS: 1, FCP: 3100, TTFB: 1800 };

/** Full PSI response. `field` = URL-level CrUX, `origin` = origin-level CrUX. */
export function psiResponse(opts: { url?: string; field?: CruxValues; origin?: CruxValues; lab?: boolean; perfScore?: number } = {}): PageSpeedResponse {
  const { url = 'https://web.dev/', field, origin, lab = true, perfScore } = opts;
  return {
    id: url,
    ...(field && { loadingExperience: crux(field) }),
    ...(origin && { originLoadingExperience: crux(origin) }),
    ...(lab && { lighthouseResult: labResult(perfScore) }),
  } as unknown as PageSpeedResponse;
}

/** Minimal fetch Response stand-in for vi.stubGlobal('fetch', ...). */
export function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

export const psiError = (status: number, message: string) => ({ error: { code: status, message } });
