import { describe, it, expect } from 'vitest';
import { classifyMetric, formatMetricValue, calculateOverallHealth } from './utils';

describe('classifyMetric (Core Web Vitals thresholds)', () => {
  it.each([
    ['LCP', 2500, 'good'], ['LCP', 2501, 'needs-improvement'], ['LCP', 4000, 'needs-improvement'], ['LCP', 4001, 'poor'],
    ['INP', 200, 'good'], ['INP', 501, 'poor'],
    ['CLS', 0.1, 'good'], ['CLS', 0.25, 'needs-improvement'], ['CLS', 0.68, 'poor'],
    ['FCP', 3100, 'poor'], ['TTFB', 1800, 'needs-improvement'],
  ] as const)('%s = %s is %s', (metric, value, expected) => {
    expect(classifyMetric(value, metric)).toBe(expected);
  });
});

describe('formatMetricValue', () => {
  it('shows LCP/FCP in seconds from 1000 ms', () => {
    expect(formatMetricValue(1700, 'LCP')).toBe('1.7 s');
    expect(formatMetricValue(850, 'FCP')).toBe('850 ms');
  });
  it('keeps INP in ms and TTFB in seconds', () => {
    expect(formatMetricValue(235, 'INP')).toBe('235 ms');
    expect(formatMetricValue(1800, 'TTFB')).toBe('1.8 s');
  });
  it('shows CLS unscaled with 2 decimals (regression: old /100 bug)', () => {
    expect(formatMetricValue(0.68, 'CLS')).toBe('0.68');
  });
});

describe('calculateOverallHealth', () => {
  it('averages good=100, NI=50, poor=0', () => {
    expect(calculateOverallHealth([{ status: 'good' }, { status: 'needs-improvement' }, { status: 'poor' }])).toBe(50);
  });
  it('returns 0 for no metrics', () => {
    expect(calculateOverallHealth([])).toBe(0);
  });
});
