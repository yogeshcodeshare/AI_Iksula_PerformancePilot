// Comparison service - Compare current vs baseline audit
import { 
  ReportPackage, 
  ComparisonResult, 
  ComparisonDelta, 
  MetricResult,
  MetricName,
  Device
} from '@/types';

export function compareReports(
  baseline: ReportPackage,
  current: ReportPackage
): ComparisonResult {
  const deltas: ComparisonDelta[] = [];
  const missingPages: string[] = [];
  const newPages: string[] = [];
  
  // Create index of baseline pages by URL + type
  const baselineIndex = new Map(
    baseline.pages.map(p => [`${p.url}|${p.pageType}`, p])
  );
  
  // Create index of current pages
  const currentIndex = new Map(
    current.pages.map(p => [`${p.url}|${p.pageType}`, p])
  );
  
  // Find common pages and compare
  for (const [key, baselinePage] of baselineIndex) {
    const currentPage = currentIndex.get(key);
    
    if (!currentPage) {
      missingPages.push(baselinePage.pageLabel);
      continue;
    }
    
    // Compare metrics for common pages
    const pageDeltas = comparePageMetrics(
      baseline,
      current,
      baselinePage.pageId,
      currentPage.pageId,
      baselinePage.pageLabel
    );
    
    deltas.push(...pageDeltas);
  }
  
  // Find new pages
  for (const [key, currentPage] of currentIndex) {
    if (!baselineIndex.has(key)) {
      newPages.push(currentPage.pageLabel);
    }
  }
  
  return {
    deltas,
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

function calculateDelta(
  baseline: MetricResult,
  current: MetricResult,
  pageLabel: string
): ComparisonDelta {
  const deltaValue = current.value - baseline.value;
  
  // For Core Web Vitals, lower is better
  let deltaDirection: 'improved' | 'regressed' | 'unchanged';
  
  // Define significant change threshold (10% of baseline)
  const threshold = baseline.value * 0.1;
  
  if (Math.abs(deltaValue) < threshold) {
    deltaDirection = 'unchanged';
  } else if (deltaValue < 0) {
    deltaDirection = 'improved';
  } else {
    deltaDirection = 'regressed';
  }
  
  return {
    baselineRunId: baseline.pageId, // Using pageId as proxy for runId in this context
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

export function getSignificantChanges(
  comparison: ComparisonResult,
  type: 'regressed' | 'improved'
): ComparisonDelta[] {
  return comparison.deltas
    .filter(d => d.deltaDirection === type)
    .sort((a, b) => b.deltaValue - a.deltaValue);
}

export function generateComparisonSummary(comparison: ComparisonResult): {
  totalCompared: number;
  improved: number;
  regressed: number;
  unchanged: number;
  missingPages: number;
  newPages: number;
} {
  return {
    totalCompared: comparison.deltas.length,
    improved: comparison.deltas.filter(d => d.deltaDirection === 'improved').length,
    regressed: comparison.deltas.filter(d => d.deltaDirection === 'regressed').length,
    unchanged: comparison.deltas.filter(d => d.deltaDirection === 'unchanged').length,
    missingPages: comparison.missingPages.length,
    newPages: comparison.newPages.length
  };
}
