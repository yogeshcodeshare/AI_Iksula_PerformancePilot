# SOP: Source Fallback Logic

## Purpose
Define when and how to fallback from PageSpeed to Lighthouse.

## Primary Flow

```
For each (URL, device):
  1. Attempt PageSpeed Insights
  2. If success → use PageSpeed result
  3. If failure → trigger Lighthouse fallback
  4. Record fallback reason
```

## PageSpeed Failure Conditions

A PageSpeed attempt is considered FAILED when ANY of the following occur:

| Condition | Detection | Fallback Reason |
|-----------|-----------|-----------------|
| HTTP error | status !== 200 | "pagespeed-http-error" |
| Timeout | > 30 seconds | "pagespeed-timeout" |
| Invalid JSON | parse error | "pagespeed-invalid-payload" |
| Missing lighthouseResult | !data.lighthouseResult | "pagespeed-incomplete-result" |
| Missing audits | !audits[key] for required metrics | "pagespeed-missing-metrics" |
| Quota exceeded | 429 status | "pagespeed-quota-exceeded" |
| Empty audits | audits[key].numericValue is null/undefined | "pagespeed-empty-metrics" |

## Required Metrics for Success

PageSpeed result is considered COMPLETE only if ALL these audits have numericValue:
- largest-contentful-paint (LCP)
- total-blocking-time (for INP estimation) OR experimental-interaction-to-next-paint
- cumulative-layout-shift (CLS)
- first-contentful-paint (FCP)
- server-response-time (TTFB)

## Fallback Procedure

```typescript
async function auditWithFallback(url: string, device: Device): Promise<MetricResult> {
  const result: MetricResult = {
    pageId: '',
    device,
    sourceAttempted: 'pagespeed',
    fallbackTriggered: false,
    capturedAt: new Date().toISOString()
  };
  
  try {
    const psResult = await fetchPageSpeed(url, device);
    if (isComplete(psResult)) {
      result.sourceUsed = 'pagespeed';
      result.metrics = extractMetrics(psResult);
      result.reportUrl = psResult.id; // PageSpeed report URL
      return result;
    }
    throw new Error('incomplete');
  } catch (error) {
    result.fallbackTriggered = true;
    result.fallbackReason = getFallbackReason(error);
    
    // Run Lighthouse
    const lhResult = await runLighthouse(url, device);
    result.sourceUsed = 'lighthouse';
    result.metrics = extractMetricsFromLighthouse(lhResult);
    return result;
  }
}
```

## UI Requirements

1. Always display `sourceUsed` in results
2. If `fallbackTriggered`, show `fallbackReason` with tooltip
3. Never hide partial failures - show them clearly
