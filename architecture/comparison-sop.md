# SOP: Report Comparison Logic

## Purpose
Define how to compare current audit against uploaded previous report.

## Input Requirements

### Current Run
- Must be a completed audit with all metrics
- Stored in memory/local storage

### Baseline (Uploaded)
- Must be a valid report.json from this tool
- Schema version should match (warn if different)
- Legacy files (spreadsheets, PDFs) accepted as best-effort with warning

## Comparison Algorithm

```typescript
function compareAudits(baseline: ReportPackage, current: ReportPackage): ComparisonResult {
  const deltas: ComparisonDelta[] = [];
  const missingPages: string[] = [];
  const newPages: string[] = [];
  
  // Index baseline pages by URL + pageType
  const baselineIndex = new Map(
    baseline.pages.map(p => [`${p.url}|${p.pageType}`, p])
  );
  
  // Index current pages
  const currentIndex = new Map(
    current.pages.map(p => [`${p.url}|${p.pageType}`, p])
  );
  
  // Find common pages
  for (const [key, baselinePage] of baselineIndex) {
    const currentPage = currentIndex.get(key);
    
    if (!currentPage) {
      missingPages.push(baselinePage.pageLabel);
      continue;
    }
    
    // Compare metrics for this page
    for (const device of ['mobile', 'desktop']) {
      for (const metric of ['LCP', 'INP', 'CLS', 'FCP', 'TTFB']) {
        const baselineMetric = findMetric(baseline, baselinePage.pageId, device, metric);
        const currentMetric = findMetric(current, currentPage.pageId, device, metric);
        
        if (baselineMetric && currentMetric) {
          const delta = calculateDelta(baselineMetric, currentMetric);
          deltas.push(delta);
        }
      }
    }
  }
  
  // Find new pages
  for (const [key, currentPage] of currentIndex) {
    if (!baselineIndex.has(key)) {
      newPages.push(currentPage.pageLabel);
    }
  }
  
  return { deltas, missingPages, newPages };
}
```

## Delta Calculation

```typescript
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

function calculateDelta(baseline: MetricResult, current: MetricResult): ComparisonDelta {
  const deltaValue = current.value - baseline.value;
  let deltaDirection: 'improved' | 'regressed' | 'unchanged';

  if (deltaValue === 0) {
    deltaDirection = 'unchanged';
  } else {
    // Use 10% of baseline OR minimum absolute threshold, whichever is larger
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
```

## Classification

| Category | Criteria |
|----------|----------|
| Regression | deltaDirection === 'regressed' AND delta exceeds max(10% baseline, min threshold) |
| Improvement | deltaDirection === 'improved' AND delta exceeds max(10% baseline, min threshold) |
| Unchanged | delta within threshold, or both values are exactly equal |

### Minimum Absolute Thresholds

These prevent false positives when baseline values are near zero (e.g., CLS 0.00 → 0.00 was previously flagged as "regressed"):

| Metric | Min Threshold | Rationale |
|--------|--------------|-----------|
| CLS | 0.01 | Unitless; changes < 0.01 are imperceptible |
| INP | 10 ms | Sub-10ms changes are within measurement noise |
| LCP, FCP, TTFB | 50 ms | Sub-50ms changes are within measurement noise |
| performance_score | 1 point | Single-point changes are insignificant |

## Compared Metrics

Only Core Web Vitals are compared in the Metrics tab: **LCP, INP, CLS, FCP, TTFB**. `performance_score` is excluded as it is represented in the Category Scores tab.

## Output Requirements

1. Delta tables for each metric
2. Charts showing improvements vs regressions
3. Missing pages list (in baseline but not current)
4. New pages list (in current but not baseline)
5. Highest impact regressions (top 5)
