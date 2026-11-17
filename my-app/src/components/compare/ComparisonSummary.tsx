'use client';

import type { ComparisonInsights, CwvVerdict } from '@/services/comparison';
import { STATUS_LABEL, SOURCE_LABEL } from '@/services/comparison';
import { formatMetricValue } from '@/lib/utils';
import type { MetricSource } from '@/types';

const verdictStyle = (v: CwvVerdict) =>
  v === 'passed' ? { background: 'var(--green-bg)', color: 'var(--green-text)' }
    : v === 'failed' ? { background: 'var(--red-bg)', color: 'var(--red-text)' }
      : { background: 'var(--background)', color: 'var(--muted-foreground)' };

const verdictText = (v: CwvVerdict) => (v === 'passed' ? 'Passed' : v === 'failed' ? 'Failed' : 'No data');

function sourceLine(counts: Record<MetricSource, number>): string {
  return (Object.keys(counts) as MetricSource[]).filter(k => counts[k] > 0).map(k => `${SOURCE_LABEL[k]} ${counts[k]}`).join(' · ') || '—';
}

/** Plain-English summary, Core Web Vitals pass/fail and threshold crossings. */
export function ComparisonSummary({ insights }: { insights: ComparisonInsights }) {
  return (
    <section aria-labelledby="cmp-summary" className="mb-8 bg-card border border-border rounded-2xl p-5 space-y-5">
      <div>
        <h3 id="cmp-summary" className="text-sm font-bold text-foreground tracking-wide mb-2">Summary</h3>
        <p className="text-sm text-foreground leading-relaxed" data-testid="comparison-summary">{insights.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">Google Core Web Vitals (all compared pages)</h4>
          <table className="text-sm w-full">
            <tbody>
              {(['mobile', 'desktop'] as const).map(dev => (
                <tr key={dev}>
                  <td className="py-1 capitalize text-muted-foreground w-24">{dev}</td>
                  <td className="py-1">
                    <span className="status-badge" style={verdictStyle(insights.cwv[dev].baseline)}>{verdictText(insights.cwv[dev].baseline)}</span>
                    <span className="mx-2 text-muted-foreground" aria-hidden="true">→</span>
                    <span className="sr-only">changed to</span>
                    <span className="status-badge" style={verdictStyle(insights.cwv[dev].current)}>{verdictText(insights.cwv[dev].current)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">Where the numbers come from</h4>
          <p className="text-xs text-muted-foreground">Baseline: {sourceLine(insights.sources.baseline)}</p>
          <p className="text-xs text-muted-foreground">Current: {sourceLine(insights.sources.current)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Real-user values are Google&apos;s 28-day average and change slowly; lab values change right after a deploy.
            Changes under 10% (or a minimum amount) count as &ldquo;Unchanged&rdquo;.
          </p>
        </div>
      </div>

      {insights.statusChanges.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
            Crossed a Google threshold ({insights.statusChanges.length})
          </h4>
          <ul className="space-y-1 text-sm m-0 p-0 list-none">
            {insights.statusChanges.map((s, i) => (
              <li key={i}>
                <span style={{ color: s.better ? 'var(--green-text)' : 'var(--red-text)' }} aria-hidden="true">{s.better ? '▲' : '▼'}</span>{' '}
                <strong>{s.metricName}</strong> on {s.pageKey} ({s.device}):{' '}
                {STATUS_LABEL[s.baselineStatus!]} → <strong>{STATUS_LABEL[s.currentStatus!]}</strong>
                <span className="text-muted-foreground"> ({formatMetricValue(s.baselineValue, s.metricName)} → {formatMetricValue(s.currentValue, s.metricName)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
