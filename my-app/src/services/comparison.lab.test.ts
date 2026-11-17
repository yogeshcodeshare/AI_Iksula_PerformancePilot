import { describe, it, expect } from 'vitest';
import { compareReports, explainRegressions, labMetric } from './comparison';
import { trimDiagnostics } from './runStore';
import { formatMetricValue } from '@/lib/utils';
import { makeReport } from '../../test/fixtures/reports';
import type { DiagnosticItem, ReportPackage } from '@/types';

const d = (pageId: string, auditKey: string, extra: Partial<DiagnosticItem> = {}) =>
  ({ id: `${pageId}-${auditKey}`, pageId, device: 'mobile', category: 'performance', group: 'diagnostics', auditKey,
     title: auditKey, description: '', status: 'pass', scoreDisplayMode: 'numeric', source: 'pagespeed',
     capturedAt: '2026-11-17', ...extra }) as DiagnosticItem;

function withDiags(r: ReportPackage, mk: (pageId: string) => DiagnosticItem[]): ReportPackage {
  return { ...r, diagnostics: r.pages.flatMap(p => mk(p.pageId)) };
}

describe('lab-only metrics (TBT, Speed Index) in comparison', () => {
  it('adds TBT and SI deltas built from Lighthouse numericValue with score-based status', () => {
    const base = withDiags(makeReport('A', [{ url: 'https://shop.test/' }]), id => [
      d(id, 'total-blocking-time', { numericValue: 150, score: 95 }), d(id, 'speed-index', { numericValue: 3000, score: 80 })]);
    const cur = withDiags(makeReport('B', [{ url: 'https://shop.test/' }]), id => [
      d(id, 'total-blocking-time', { numericValue: 900, score: 30 }), d(id, 'speed-index', { numericValue: 2950, score: 81 })]);
    const r = compareReports(base, cur);
    const tbt = r.deltas.find(x => x.metricName === 'TBT')!;
    expect(tbt.deltaDirection).toBe('regressed');
    expect(tbt.baselineStatus).toBe('good');
    expect(tbt.currentStatus).toBe('poor');
    expect(tbt.currentSource).toBe('lab');
    expect(r.deltas.find(x => x.metricName === 'SI')?.deltaDirection).toBe('unchanged'); // under 100 ms minimum
  });

  it('skips a lab metric when either run lacks it (never invents a value)', () => {
    expect(labMetric([d('p', 'speed-index')], 'p', 'mobile', 'SI')).toBeNull();
    const base = makeReport('A', [{ url: 'https://shop.test/' }]);
    expect(compareReports(base, base).deltas.some(x => x.metricName === 'TBT')).toBe(false);
  });

  it('formats TBT in ms and SI in seconds', () => {
    expect(formatMetricValue(420, 'TBT')).toBe('420 ms');
    expect(formatMetricValue(3400, 'SI')).toBe('3.4 s');
  });

  it('saved runs keep lab metric audits even when they pass', () => {
    const out = trimDiagnostics([d('p', 'total-blocking-time', { numericValue: 10 }), d('p', 'unused-javascript')]);
    expect(out.map(x => x.auditKey)).toEqual(['total-blocking-time']);
  });
});

describe('explainRegressions', () => {
  it('links a regression to the first related failing Lighthouse audit with its fix', () => {
    const base = makeReport('A', [{ url: 'https://shop.test/', metrics: { LCP: 2000 } }]);
    const cur = withDiags(makeReport('B', [{ url: 'https://shop.test/', metrics: { LCP: 4500 } }]), id => [
      d(id, 'unused-javascript', { status: 'fail', title: 'Reduce unused JavaScript', displayValue: 'Est savings 300 KiB' }),
      d(id, 'render-blocking-resources', { status: 'warning', title: 'Eliminate render-blocking resources' }),
    ]);
    const regs = compareReports(base, cur).deltas.filter(x => x.deltaDirection === 'regressed' && x.device === 'mobile');
    const [c] = explainRegressions(regs, cur);
    expect(c.delta.metricName).toBe('LCP');
    expect(c.auditKey).toBe('render-blocking-resources'); // higher priority for LCP
    expect(c.fix.length).toBeGreaterThan(10);
  });

  it('returns nothing when no related audit is failing', () => {
    const base = makeReport('A', [{ url: 'https://shop.test/', metrics: { LCP: 2000 } }]);
    const cur = makeReport('B', [{ url: 'https://shop.test/', metrics: { LCP: 4500 } }]);
    const regs = compareReports(base, cur).deltas.filter(x => x.deltaDirection === 'regressed');
    expect(explainRegressions(regs, cur)).toEqual([]);
  });
});
