# SOP: Threshold Mapping

## Purpose
Define how metric values are classified into Good/Needs Improvement/Poor categories.

## Threshold Configuration

```typescript
export const THRESHOLDS = {
  LCP: {
    good: 2500,        // ≤ 2.5s
    warn: 4000,        // ≤ 4.0s
    unit: 'ms',
    name: 'Largest Contentful Paint',
    description: 'Loading performance'
  },
  INP: {
    good: 200,         // ≤ 200ms
    warn: 500,         // ≤ 500ms
    unit: 'ms',
    name: 'Interaction to Next Paint',
    description: 'Interactivity'
  },
  CLS: {
    good: 0.1,         // ≤ 0.1
    warn: 0.25,        // ≤ 0.25
    unit: '',
    name: 'Cumulative Layout Shift',
    description: 'Visual stability'
  },
  FCP: {
    good: 1800,        // ≤ 1.8s
    warn: 3000,        // ≤ 3.0s
    unit: 'ms',
    name: 'First Contentful Paint',
    description: 'First content appearance'
  },
  TTFB: {
    good: 800,         // ≤ 0.8s
    warn: 1800,        // ≤ 1.8s
    unit: 'ms',
    name: 'Time to First Byte',
    description: 'Server response time'
  }
} as const;
```

## Classification Logic

```typescript
function classifyMetric(value: number, metric: keyof typeof THRESHOLDS): Status {
  const t = THRESHOLDS[metric];
  
  if (value <= t.good) return 'good';
  if (value <= t.warn) return 'needs-improvement';
  return 'poor';
}
```

## Rules
1. Thresholds are device-agnostic (same for mobile/desktop)
2. Lower is better for all metrics
3. Status must be stored with every metric result
4. Thresholds can be overridden in Settings but default to Core Web Vitals
