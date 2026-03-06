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
function calculateDelta(baseline: MetricResult, current: MetricResult): ComparisonDelta {
  const deltaValue = current.value - baseline.value;
  
  // For all Core Web Vitals, lower is better
  const deltaDirection = deltaValue < 0 ? 'improved' 
    : deltaValue > 0 ? 'regressed' 
    : 'unchanged';
  
  return {
    baselineRunId: baseline.runId,
    currentRunId: current.runId,
    pageKey: current.pageId,
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
| Regression | deltaDirection === 'regressed' AND delta exceeds 10% threshold |
| Improvement | deltaDirection === 'improved' AND delta exceeds 10% threshold |
| Unchanged | delta within 10% or exactly equal |

## Output Requirements

1. Delta tables for each metric
2. Charts showing improvements vs regressions
3. Missing pages list (in baseline but not current)
4. New pages list (in current but not baseline)
5. Highest impact regressions (top 5)
