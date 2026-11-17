// Comparison service - Compare current vs baseline audit
import { 
  ReportPackage, 
  ComparisonResult, 
  ComparisonDelta, 
  MetricResult,
  MetricName,
  Device,
  CategoryScore,
  CategoryScoreDelta,
  CategoryName,
  CWVAssessment,
  AuditPage,
  MetricSource,
  ComparedMetricName,
  LabMetricName,
  DiagnosticItem
} from '@/types';
import { formatMetricValue } from '@/lib/utils';
import { RECOMMENDATION_MAP } from './recommendations';

const TRACKING_PARAMS = /^(utm_.*|gclid|fbclid|msclkid|mc_cid|mc_eid)$/i;

/**
 * Canonical form of a page URL for matching pages across audit runs.
 * Ignores scheme, `www.`, trailing slash, fragment and tracking params;
 * keeps meaningful query params (e.g. search `?q=`), sorted.
 */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  let u: URL;
  try {
    u = new URL(/^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, '');
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  const port = u.port ? `:${u.port}` : '';
  const path = u.pathname.replace(/\/+$/, '');
  const params = [...u.searchParams.entries()]
    .filter(([k]) => !TRACKING_PARAMS.test(k))
    .sort(([a], [b]) => a.localeCompare(b));
  const query = params.length ? `?${new URLSearchParams(params).toString()}` : '';
  return `${host}${port}${path}${query}`;
}

export interface PageMatchResult {
  pairs: Array<[AuditPage, AuditPage]>;
  unmatchedBaseline: AuditPage[];
  unmatchedCurrent: AuditPage[];
}

/** Pair baseline pages with current pages: 1) normalized URL, 2) label + page type. */
export function matchPages(baselinePages: AuditPage[], currentPages: AuditPage[]): PageMatchResult {
  const pairs: Array<[AuditPage, AuditPage]> = [];
  const remainingCurrent = [...currentPages];
  const unmatched: AuditPage[] = [];

  const take = (pred: (p: AuditPage) => boolean) => {
    const i = remainingCurrent.findIndex(pred);
    return i === -1 ? null : remainingCurrent.splice(i, 1)[0];
  };

  for (const b of baselinePages) {
    const key = normalizeUrl(b.url);
    const c = take(p => normalizeUrl(p.url) === key);
    if (c) pairs.push([b, c]); else unmatched.push(b);
  }

  const unmatchedBaseline: AuditPage[] = [];
  for (const b of unmatched) {
    const label = b.pageLabel.trim().toLowerCase();
    const c = label ? take(p => p.pageLabel.trim().toLowerCase() === label && p.pageType === b.pageType) : null;
    if (c) pairs.push([b, c]); else unmatchedBaseline.push(b);
  }

  return { pairs, unmatchedBaseline, unmatchedCurrent: remainingCurrent };
}

export function compareReports(
  baseline: ReportPackage,
  current: ReportPackage
): ComparisonResult {
  const deltas: ComparisonDelta[] = [];
  const categoryScoreDeltas: CategoryScoreDelta[] = [];
  const missingPages: string[] = [];
  const newPages: string[] = [];
  
  // Pair pages by normalized URL, then by label (see architecture/comparison-sop.md)
  const { pairs, unmatchedBaseline, unmatchedCurrent } = matchPages(baseline.pages, current.pages);
  missingPages.push(...unmatchedBaseline.map(p => p.pageLabel));
  newPages.push(...unmatchedCurrent.map(p => p.pageLabel));

  for (const [baselinePage, currentPage] of pairs) {
    // Compare metrics for common pages
    const pageDeltas = comparePageMetrics(
      baseline,
      current,
      baselinePage.pageId,
      currentPage.pageId,
      baselinePage.pageLabel
    ).map(d => ({ ...d, pageUrl: currentPage.url }));
    
    deltas.push(...pageDeltas);
    
    // Compare category scores
    const scoreDeltas = compareCategoryScores(
      baseline,
      current,
      baselinePage.pageId,
      currentPage.pageId,
      baselinePage.pageLabel
    );
    
    categoryScoreDeltas.push(...scoreDeltas);
  }

  return {
    deltas,
    categoryScoreDeltas,
    missingPages,
    newPages,
    baselineRun: baseline.auditRun,
    currentRun: current.auditRun
  };
}

function comparePageMetrics(
  baseline: ReportPackage,
  current: ReportPackage,
  baselinePageId: string,
  currentPageId: string,
  pageLabel: string
): ComparisonDelta[] {
  const deltas: ComparisonDelta[] = [];
  const devices: Device[] = ['mobile', 'desktop'];
  const metrics: MetricName[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
  
  for (const device of devices) {
    for (const metricName of metrics) {
      const baselineMetric = baseline.metrics.find(
        m => m.pageId === baselinePageId && m.device === device && m.metricName === metricName
      );
      
      const currentMetric = current.metrics.find(
        m => m.pageId === currentPageId && m.device === device && m.metricName === metricName
      );
      
      if (baselineMetric && currentMetric) {
        const delta = calculateDelta(baselineMetric, currentMetric, pageLabel);
        deltas.push(delta);
      }
    }
    // Lab-only metrics (Lighthouse): Total Blocking Time and Speed Index
    for (const name of Object.keys(LAB_METRIC_AUDITS) as LabMetricName[]) {
      const b = labMetric(baseline.diagnostics, baselinePageId, device, name);
      const c = labMetric(current.diagnostics, currentPageId, device, name);
      if (b && c) deltas.push(calculateDelta(b, c, pageLabel));
    }
  }
  
  return deltas;
}

/** Lighthouse audit id for each lab-only metric. */
export const LAB_METRIC_AUDITS: Record<LabMetricName, string> = {
  TBT: 'total-blocking-time',
  SI: 'speed-index',
};

/**
 * Build a MetricResult for a lab-only metric from the Lighthouse diagnostic
 * item (numericValue in ms). Status follows the Lighthouse score
 * (>=90 good, >=50 needs improvement, else poor). Never invents a value.
 */
export function labMetric(
  diagnostics: DiagnosticItem[] | undefined,
  pageId: string,
  device: Device,
  name: LabMetricName,
): MetricResult | null {
  const d = diagnostics?.find(x => x.pageId === pageId && x.device === device && x.auditKey === LAB_METRIC_AUDITS[name]);
  if (!d || typeof d.numericValue !== 'number') return null;
  const score = d.score ?? 0;
  return {
    pageId, device,
    metricName: name as unknown as MetricName,
    value: d.numericValue,
    unit: 'ms',
    thresholdGood: 0, thresholdWarn: 0,
    status: score >= 90 ? 'good' : score >= 50 ? 'needs-improvement' : 'poor',
    sourceAttempted: d.source, sourceUsed: d.source,
    fallbackTriggered: true,
    fallbackReason: 'Lab (Lighthouse)',
    capturedAt: d.capturedAt,
  };
}

function compareCategoryScores(
  baseline: ReportPackage,
  current: ReportPackage,
  baselinePageId: string,
  currentPageId: string,
  pageLabel: string
): CategoryScoreDelta[] {
  const deltas: CategoryScoreDelta[] = [];
  const devices: Device[] = ['mobile', 'desktop'];
  const categories: CategoryName[] = ['performance', 'accessibility', 'best-practices', 'seo'];
  
  for (const device of devices) {
    for (const category of categories) {
      const baselineScore = baseline.categoryScores?.find(
        s => s.pageId === baselinePageId && s.device === device && s.category === category
      );
      
      const currentScore = current.categoryScores?.find(
        s => s.pageId === currentPageId && s.device === device && s.category === category
      );
      
      if (baselineScore && currentScore) {
        const delta = calculateCategoryScoreDelta(baselineScore, currentScore, pageLabel);
        deltas.push(delta);
      }
    }
  }
  
  return deltas;
}

// Minimum absolute thresholds to avoid false positives on near-zero values
function getMinThreshold(metricName: ComparedMetricName): number {
  switch (metricName) {
    case 'CLS': return 0.01;
    case 'INP': return 10;
    case 'LCP': case 'FCP': case 'TTFB': return 50;
    case 'performance_score': return 1;
    case 'TBT': return 50;
    case 'SI': return 100;
    default: return 0;
  }
}

function calculateDelta(
  baseline: MetricResult,
  current: MetricResult,
  pageLabel: string
): ComparisonDelta {
  const deltaValue = current.value - baseline.value;

  // For Core Web Vitals, lower is better
  let deltaDirection: 'improved' | 'regressed' | 'unchanged';

  if (deltaValue === 0) {
    deltaDirection = 'unchanged';
  } else {
    // Use 10% of baseline OR a minimum absolute threshold, whichever is larger
    const threshold = Math.max(baseline.value * 0.1, getMinThreshold(baseline.metricName as ComparedMetricName));

    if (Math.abs(deltaValue) < threshold) {
      deltaDirection = 'unchanged';
    } else if (deltaValue < 0) {
      deltaDirection = 'improved';
    } else {
      deltaDirection = 'regressed';
    }
  }
  
  return {
    baselineRunId: baseline.pageId,
    currentRunId: current.pageId,
    pageKey: pageLabel,
    metricName: current.metricName as ComparedMetricName,
    device: current.device,
    baselineValue: baseline.value,
    currentValue: current.value,
    deltaValue: Math.abs(deltaValue),
    deltaDirection,
    baselineStatus: baseline.status,
    currentStatus: current.status,
    baselineSource: metricSource(baseline),
    currentSource: metricSource(current),
    percentChange: baseline.value !== 0 ? Math.round((deltaValue / baseline.value) * 1000) / 10 : null,
  };
}

/** Where a metric value came from (see extractMetrics in audit.ts). */
export function metricSource(m: MetricResult): MetricSource {
  const reason = (m.fallbackReason || '').toLowerCase();
  if (reason.includes('origin')) return 'field-origin';
  if (!m.fallbackTriggered && (reason.includes('crux') || reason.includes('real users') || reason === '')) return 'field-url';
  return 'lab';
}

function calculateCategoryScoreDelta(
  baseline: CategoryScore,
  current: CategoryScore,
  pageLabel: string
): CategoryScoreDelta {
  const delta = current.score - baseline.score;
  
  let deltaDirection: 'improved' | 'regressed' | 'unchanged';
  
  // For scores, a change of 5+ points is significant
  if (Math.abs(delta) < 5) {
    deltaDirection = 'unchanged';
  } else if (delta > 0) {
    deltaDirection = 'improved';
  } else {
    deltaDirection = 'regressed';
  }
  
  return {
    pageKey: pageLabel,
    category: current.category,
    device: current.device,
    baselineScore: baseline.score,
    currentScore: current.score,
    delta: Math.abs(delta),
    deltaDirection
  };
}

export function getSignificantChanges(
  comparison: ComparisonResult,
  type: 'regressed' | 'improved'
): ComparisonDelta[] {
  return comparison.deltas
    .filter(d => d.deltaDirection === type)
    .sort((a, b) => b.deltaValue - a.deltaValue);
}

export function getSignificantCategoryChanges(
  comparison: ComparisonResult,
  type: 'regressed' | 'improved'
): CategoryScoreDelta[] {
  return comparison.categoryScoreDeltas
    .filter(d => d.deltaDirection === type)
    .sort((a, b) => b.delta - a.delta);
}

export function generateComparisonSummary(comparison: ComparisonResult): {
  totalCompared: number;
  improved: number;
  regressed: number;
  unchanged: number;
  missingPages: number;
  newPages: number;
  categoryScoresCompared: number;
  categoryScoresImproved: number;
  categoryScoresRegressed: number;
  categoryScoresUnchanged: number;
} {
  return {
    totalCompared: comparison.deltas.length,
    improved: comparison.deltas.filter(d => d.deltaDirection === 'improved').length,
    regressed: comparison.deltas.filter(d => d.deltaDirection === 'regressed').length,
    unchanged: comparison.deltas.filter(d => d.deltaDirection === 'unchanged').length,
    missingPages: comparison.missingPages.length,
    newPages: comparison.newPages.length,
    categoryScoresCompared: comparison.categoryScoreDeltas.length,
    categoryScoresImproved: comparison.categoryScoreDeltas.filter(d => d.deltaDirection === 'improved').length,
    categoryScoresRegressed: comparison.categoryScoreDeltas.filter(d => d.deltaDirection === 'regressed').length,
    categoryScoresUnchanged: comparison.categoryScoreDeltas.filter(d => d.deltaDirection === 'unchanged').length,
  };
}

// Compare CWV Assessments between baseline and current
export function compareCWVAssessments(
  baseline: CWVAssessment[],
  current: CWVAssessment[]
): {
  pageId: string;
  device: Device;
  baselineStatus: CWVAssessment['status'];
  currentStatus: CWVAssessment['status'];
  changed: boolean;
  improvement: boolean;
}[] {
  const results: {
    pageId: string;
    device: Device;
    baselineStatus: CWVAssessment['status'];
    currentStatus: CWVAssessment['status'];
    changed: boolean;
    improvement: boolean;
  }[] = [];
  
  for (const currentAssessment of current) {
    const baselineAssessment = baseline.find(
      b => b.pageId === currentAssessment.pageId && b.device === currentAssessment.device
    );
    
    if (baselineAssessment) {
      const statusOrder = { 'passed': 2, 'failed': 1, 'not-available': 0 };
      const baselineScore = statusOrder[baselineAssessment.status];
      const currentScore = statusOrder[currentAssessment.status];
      
      results.push({
        pageId: currentAssessment.pageId,
        device: currentAssessment.device,
        baselineStatus: baselineAssessment.status,
        currentStatus: currentAssessment.status,
        changed: baselineAssessment.status !== currentAssessment.status,
        improvement: currentScore > baselineScore
      });
    }
  }
  
  return results;
}

// ---------------------------------------------------------------------------
// Comparison insights (summary, status changes, CWV pass/fail, data source)
// ---------------------------------------------------------------------------

export type CwvVerdict = 'passed' | 'failed' | 'n/a';

export interface ComparisonInsights {
  counts: { compared: number; improved: number; regressed: number; unchanged: number };
  biggestImprovement: ComparisonDelta | null;
  biggestRegression: ComparisonDelta | null;
  /** Metrics that moved between Good / Needs improvement / Poor. */
  statusChanges: Array<ComparisonDelta & { better: boolean }>;
  /** Run-level Core Web Vitals verdict per device (all compared pages must pass). */
  cwv: Record<Device, { baseline: CwvVerdict; current: CwvVerdict }>;
  /** How many compared values came from real users vs a lab test, per run. */
  sources: { baseline: Record<MetricSource, number>; current: Record<MetricSource, number> };
  /** One-paragraph plain-English summary. */
  summary: string;
}

const STATUS_RANK: Record<string, number> = { good: 0, 'needs-improvement': 1, poor: 2 };
export const STATUS_LABEL: Record<string, string> = { good: 'Good', 'needs-improvement': 'Needs improvement', poor: 'Poor' };
export const SOURCE_LABEL: Record<MetricSource, string> = {
  'field-url': 'Real users (this page)', 'field-origin': 'Real users (whole site)', lab: 'Lab test',
};

function runVerdict(pkg: ReportPackage, pageIds: Set<string>, device: Device): CwvVerdict {
  const rows = (pkg.cwvAssessments ?? []).filter(a => pageIds.has(a.pageId) && a.device === device);
  if (rows.length === 0 || rows.every(r => r.status === 'not-available')) return 'n/a';
  return rows.every(r => r.passed) ? 'passed' : 'failed';
}

function fmtDelta(d: ComparisonDelta): string {
  const sign = d.deltaDirection === 'improved' ? '-' : '+';
  const pct = d.percentChange != null ? ` (${d.percentChange > 0 ? '+' : ''}${d.percentChange}%)` : '';
  return `${d.metricName} ${sign}${formatMetricValue(d.deltaValue, d.metricName)}${pct} on ${d.pageKey} (${d.device})`;
}

export function buildComparisonInsights(
  comparison: ComparisonResult,
  baseline: ReportPackage,
  current: ReportPackage,
): ComparisonInsights {
  const deltas = comparison.deltas;
  const improved = deltas.filter(d => d.deltaDirection === 'improved');
  const regressed = deltas.filter(d => d.deltaDirection === 'regressed');
  const byPct = (a: ComparisonDelta, b: ComparisonDelta) => Math.abs(b.percentChange ?? 0) - Math.abs(a.percentChange ?? 0);

  const statusChanges = deltas
    .filter(d => d.baselineStatus && d.currentStatus && d.baselineStatus !== d.currentStatus)
    .map(d => ({ ...d, better: STATUS_RANK[d.currentStatus!] < STATUS_RANK[d.baselineStatus!] }));

  const { pairs } = matchPages(baseline.pages, current.pages);
  const baseIds = new Set(pairs.map(([b]) => b.pageId));
  const curIds = new Set(pairs.map(([, c]) => c.pageId));
  const cwv = {
    mobile: { baseline: runVerdict(baseline, baseIds, 'mobile'), current: runVerdict(current, curIds, 'mobile') },
    desktop: { baseline: runVerdict(baseline, baseIds, 'desktop'), current: runVerdict(current, curIds, 'desktop') },
  };

  const empty = (): Record<MetricSource, number> => ({ 'field-url': 0, 'field-origin': 0, lab: 0 });
  const sources = { baseline: empty(), current: empty() };
  for (const d of deltas) {
    if (d.baselineSource) sources.baseline[d.baselineSource]++;
    if (d.currentSource) sources.current[d.currentSource]++;
  }

  const biggestImprovement = [...improved].sort(byPct)[0] ?? null;
  const biggestRegression = [...regressed].sort(byPct)[0] ?? null;

  const parts: string[] = [];
  if (deltas.length === 0) {
    parts.push('No pages could be matched between the two runs, so nothing was compared.');
  } else {
    parts.push(`${deltas.length} measurements compared: ${improved.length} improved, ${regressed.length} got worse, ${deltas.length - improved.length - regressed.length} unchanged.`);
    if (biggestImprovement) parts.push(`Biggest improvement: ${fmtDelta(biggestImprovement)}.`);
    if (biggestRegression) parts.push(`Biggest problem: ${fmtDelta(biggestRegression)}.`);
    const flips = (['mobile', 'desktop'] as Device[])
      .filter(dev => cwv[dev].baseline !== 'n/a' && cwv[dev].current !== 'n/a' && cwv[dev].baseline !== cwv[dev].current)
      .map(dev => `${dev} Core Web Vitals ${cwv[dev].baseline} \u2192 ${cwv[dev].current}`);
    if (flips.length) parts.push(`Change in Google's pass/fail: ${flips.join('; ')}.`);
    const fieldShare = (sources.current['field-url'] + sources.current['field-origin']) / Math.max(1, deltas.length);
    if (fieldShare > 0.5 && regressed.length === 0 && improved.length === 0) {
      parts.push('Most values are real-user data averaged over 28 days, which changes slowly; a deploy may take days to show.');
    }
  }

  return {
    counts: { compared: deltas.length, improved: improved.length, regressed: regressed.length, unchanged: deltas.length - improved.length - regressed.length },
    biggestImprovement, biggestRegression, statusChanges, cwv, sources, summary: parts.join(' '),
  };
}

// ── Item 10: likely cause + fix for each regression ──────────────────────────

/** Lighthouse audits that commonly drive each metric (most impactful first). */
export const METRIC_RELATED_AUDITS: Record<ComparedMetricName, string[]> = {
  LCP: ['render-blocking-resources', 'server-response-time', 'largest-contentful-paint-element', 'modern-image-formats', 'uses-responsive-images', 'offscreen-images', 'unused-javascript', 'unused-css-rules', 'total-byte-weight'],
  FCP: ['render-blocking-resources', 'server-response-time', 'unused-css-rules', 'font-display', 'redirects'],
  TTFB: ['server-response-time', 'redirects'],
  INP: ['unused-javascript', 'legacy-javascript', 'bootup-time', 'mainthread-work-breakdown', 'unminified-javascript'],
  TBT: ['unused-javascript', 'legacy-javascript', 'bootup-time', 'mainthread-work-breakdown', 'unminified-javascript'],
  CLS: ['layout-shifts', 'unsized-images', 'font-display'],
  SI: ['render-blocking-resources', 'font-display', 'unused-css-rules', 'server-response-time'],
  performance_score: ['render-blocking-resources', 'unused-javascript', 'server-response-time'],
};

export interface RegressionCause {
  delta: ComparisonDelta;
  auditKey: string;
  title: string;
  displayValue?: string;
  fix: string;
  owner?: string;
}

/**
 * For each regression, the first failing/warning Lighthouse audit (in the
 * CURRENT run, same page + device) related to that metric. Guidance comes from
 * the static recommendation map, falling back to the audit's own title.
 * Regressions with no related failing audit are omitted (nothing is invented).
 */
export function explainRegressions(regressions: ComparisonDelta[], current: ReportPackage): RegressionCause[] {
  const out: RegressionCause[] = [];
  for (const r of regressions) {
    const keys = METRIC_RELATED_AUDITS[r.metricName] ?? [];
    const issues = (current.diagnostics ?? []).filter(d =>
      d.pageId === r.currentRunId && d.device === r.device && (d.status === 'fail' || d.status === 'warning'));
    for (const key of keys) {
      const d = issues.find(x => x.auditKey === key);
      if (!d) continue;
      const rec = RECOMMENDATION_MAP[key];
      out.push({
        delta: r, auditKey: key, title: d.title, displayValue: d.displayValue,
        fix: rec?.recommendation ?? d.recommendation ?? `See Lighthouse audit "${d.title}".`,
        owner: rec?.suggestedOwner ?? d.suggestedOwner,
      });
      break;
    }
  }
  return out;
}
