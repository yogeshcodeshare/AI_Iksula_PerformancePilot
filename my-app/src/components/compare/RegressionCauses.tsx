'use client';

import type { RegressionCause } from '@/services/comparison';
import { formatMetricValue } from '@/lib/utils';

/** "Why it got worse & what to fix": one row per regression with a related Lighthouse issue. */
export function RegressionCauses({ causes }: { causes: RegressionCause[] }) {
  if (causes.length === 0) return null;
  return (
    <section aria-labelledby="cmp-causes" className="mb-8 bg-card border border-border rounded-2xl p-5" data-testid="regression-causes">
      <h3 id="cmp-causes" className="text-sm font-bold text-foreground tracking-wide mb-1">Why it got worse &amp; what to fix</h3>
      <p className="text-xs text-muted-foreground mb-3">Top related Lighthouse issue found in the current run for each regression.</p>
      <ul className="space-y-3">
        {causes.map((c, i) => (
          <li key={i} className="border border-border rounded-xl p-3">
            <div className="text-sm font-semibold text-foreground">
              {c.delta.metricName} on {c.delta.pageKey} ({c.delta.device}):{' '}
              <span style={{ color: 'var(--red-text)' }}>
                {formatMetricValue(c.delta.baselineValue, c.delta.metricName)} &rarr; {formatMetricValue(c.delta.currentValue, c.delta.metricName)}
              </span>
            </div>
            <div className="text-xs text-foreground mt-1">
              <span className="font-semibold">Likely cause:</span> {c.title}{c.displayValue ? ` (${c.displayValue})` : ''}
            </div>
            <div className="text-xs text-foreground mt-0.5">
              <span className="font-semibold">Fix:</span> {c.fix}{c.owner ? <span className="text-muted-foreground"> &middot; owner: {c.owner}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
