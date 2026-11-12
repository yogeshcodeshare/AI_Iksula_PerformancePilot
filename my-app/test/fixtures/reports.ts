import type { ReportPackage, MetricName, Device, PageType } from '@/types';
import { THRESHOLDS } from '@/lib/constants';
import { classifyMetric } from '@/lib/utils';

export interface PageSpec {
  url: string;
  label?: string;
  pageType?: PageType;
  metrics?: Partial<Record<MetricName, number>>;
}

const DEFAULTS: Record<'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB', number> = {
  LCP: 3000, INP: 235, CLS: 0.01, FCP: 3100, TTFB: 1800,
};

/** Builds a minimal but schema-complete ReportPackage, shaped like an app export. */
export function makeReport(runId: string, pages: PageSpec[]): ReportPackage {
  const now = '2026-11-12T11:25:00.000Z';
  const auditPages = pages.map((p, i) => ({
    pageId: `${runId}-p${i}`,
    runId,
    pageLabel: p.label ?? `Page ${i + 1}`,
    pageType: p.pageType ?? 'homepage',
    url: p.url,
    sortOrder: i,
  }));
  const devices: Device[] = ['mobile', 'desktop'];
  const metrics = auditPages.flatMap((page, i) =>
    devices.flatMap(device =>
      (Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]).map(metricName => {
        const value = pages[i].metrics?.[metricName] ?? DEFAULTS[metricName];
        const t = THRESHOLDS[metricName];
        return {
          pageId: page.pageId, device, metricName, value,
          unit: t.unit, thresholdGood: t.good, thresholdWarn: t.warn,
          status: classifyMetric(value, metricName),
          sourceAttempted: 'pagespeed', sourceUsed: 'pagespeed',
          fallbackTriggered: false, capturedAt: now,
        };
      }),
    ),
  );
  return {
    metadata: { schemaVersion: '1.0.0', appVersion: '1.0.0', generatedAt: now,
      thresholdProfile: 'core-web-vitals-default', sourcePolicy: 'pagespeed-first-lighthouse-fallback' },
    auditRun: { runId, projectName: 'Fixture', auditLabel: runId, environment: 'production', generatedAt: now } as unknown as ReportPackage['auditRun'],
    pages: auditPages,
    metrics: metrics as unknown as ReportPackage['metrics'],
    categoryScores: [], diagnostics: [], cwvAssessments: [], evidence: [],
  };
}
