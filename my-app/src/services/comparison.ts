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
  AuditPage
} from '@/types';

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
    );
    
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
  }
  
  return deltas;
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
function getMinThreshold(metricName: MetricName): number {
  switch (metricName) {
    case 'CLS': return 0.01;
    case 'INP': return 10;
    case 'LCP': case 'FCP': case 'TTFB': return 50;
    case 'performance_score': return 1;
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
    const threshold = Math.max(baseline.value * 0.1, getMinThreshold(baseline.metricName));

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
    metricName: current.metricName,
    device: current.device,
    baselineValue: baseline.value,
    currentValue: current.value,
    deltaValue: Math.abs(deltaValue),
    deltaDirection
  };
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
