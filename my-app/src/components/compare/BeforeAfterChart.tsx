'use client';

import type { ComparisonDelta, Status } from '@/types';
import { formatMetricValue } from '@/lib/utils';

export const CHART_ORDER = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB', 'TBT', 'SI'] as const;

const barColor = (s?: Status) =>
  s === 'good' ? 'var(--green-bar, #16a34a)' : s === 'needs-improvement' ? 'var(--amber-text, #d97706)' : s === 'poor' ? 'var(--red-text, #dc2626)' : 'var(--muted-foreground)';

/**
 * Before/after bars per metric for ONE page and device. Each metric is scaled
 * to its own max (units differ); bar colour = Good / Needs improvement / Poor.
 */
export function BeforeAfterChart({ deltas, pageKey, device }: { deltas: ComparisonDelta[]; pageKey: string; device: string }) {
  const rows = CHART_ORDER.map(m => deltas.find(d => d.metricName === m)).filter((d): d is ComparisonDelta => !!d);
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="cmp-chart" className="mb-8 bg-card border border-border rounded-2xl p-5" data-testid="before-after-chart">
      <h3 id="cmp-chart" className="text-sm font-bold text-foreground tracking-wide mb-1">Before vs after: {pageKey} ({device})</h3>
      <p className="text-xs text-muted-foreground mb-4">Lower is better. Top bar = baseline, bottom bar = current; colour shows Good / Needs improvement / Poor.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {rows.map(d => {
          const max = Math.max(d.baselineValue, d.currentValue) || 1;
          return (
            <figure key={d.metricName} className="m-0" aria-label={`${d.metricName}: ${formatMetricValue(d.baselineValue, d.metricName)} to ${formatMetricValue(d.currentValue, d.metricName)}`}>
              <figcaption className="text-[11px] font-semibold text-foreground mb-1.5">{d.metricName}</figcaption>
              {([['Before', d.baselineValue, d.baselineStatus], ['After', d.currentValue, d.currentStatus]] as const).map(([label, v, s]) => (
                <div key={label} className="mb-1.5">
                  <div className="h-3 rounded bg-background overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${Math.max(3, (v / max) * 100)}%`, background: barColor(s) }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{label}: {formatMetricValue(v, d.metricName)}</div>
                </div>
              ))}
            </figure>
          );
        })}
      </div>
    </section>
  );
}
