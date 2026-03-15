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
  CWVAssessment
} from '@/types';

export function compareReports(
  baseline: ReportPackage,
  current: ReportPackage
): ComparisonResult {
  const deltas: ComparisonDelta[] = [];
  const categoryScoreDeltas: CategoryScoreDelta[] = [];
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
  
  // Find new pages
  for (const [key, currentPage] of currentIndex) {
    if (!baselineIndex.has(key)) {
      newPages.push(currentPage.pageLabel);
    }
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
  const metrics: MetricName[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB', 'performance_score'];
  
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
