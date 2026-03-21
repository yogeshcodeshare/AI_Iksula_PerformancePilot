'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AuditPage, MetricResult, CWVAssessment } from '@/types';
import Link from 'next/link';

interface ExecutiveSummaryCardProps {
  pages: AuditPage[];
  metrics: MetricResult[];
  cwvAssessments: CWVAssessment[];
  isPartial?: boolean;
  pageFailures?: Array<{ pageId: string; pageLabel: string; device: string; errorCode: string; errorMessage: string }>;
  retryAttempt?: number;
}

export function ExecutiveSummaryCard({
  pages,
  metrics,
  cwvAssessments,
  isPartial,
  pageFailures,
  retryAttempt
}: ExecutiveSummaryCardProps) {
  const cwvPassCount = (cwvAssessments || []).filter(a => a.status === 'passed').length;
  const cwvTotalCount = (cwvAssessments || []).filter(a => a.status !== 'not-available').length;
  const poorPages = pages.filter(page =>
    metrics.some(m => m.pageId === page.pageId && m.status === 'poor')
  );
  const topCriticalPage = poorPages[0];
  const metricPoorCounts: Record<string, number> = {};
  metrics.filter(m => m.status === 'poor').forEach(m => {
    metricPoorCounts[m.metricName] = (metricPoorCounts[m.metricName] || 0) + 1;
  });
  const highestRiskMetric = Object.entries(metricPoorCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <Card className="rounded-xl shadow-sm border-slate-200 mb-8 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-blue-600" />
        <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Executive Summary</h2>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CWV Status */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Core Web Vitals</p>
            <div className="flex items-center gap-2 mt-1">
              {cwvTotalCount > 0 ? (
                <span className={`text-2xl font-black ${cwvPassCount === cwvTotalCount ? 'text-green-600' : cwvPassCount > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {cwvPassCount}/{cwvTotalCount}
                </span>
              ) : (
                <span className="text-2xl font-black text-slate-400">N/A</span>
              )}
              <span className="text-sm text-slate-600">page-device pairs pass CWV</span>
            </div>
          </div>

          {/* Top Critical Page */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attention Required</p>
            {topCriticalPage ? (
              <div className="mt-1">
                <p className="font-semibold text-slate-900 text-sm">{topCriticalPage.pageLabel}</p>
                <p className="text-xs text-red-600 font-medium">
                  {metrics.filter(m => m.pageId === topCriticalPage.pageId && m.status === 'poor').length} poor metric(s)
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{topCriticalPage.url}</p>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <p className="text-sm text-green-700 font-medium">No critical issues found</p>
              </div>
            )}
          </div>

          {/* Highest Risk Metric */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Highest Risk Metric</p>
            {highestRiskMetric ? (
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold text-sm">
                  {highestRiskMetric[0]}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Poor on {highestRiskMetric[1]} metric result{highestRiskMetric[1] > 1 ? 's' : ''}
                </p>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <p className="text-sm text-green-700 font-medium">All metrics within range</p>
              </div>
            )}
          </div>
        </div>

        {isPartial && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-700 font-semibold">
                  Partial audit — {pageFailures?.length || 0} page-device {(pageFailures?.length || 0) === 1 ? 'result' : 'results'} unavailable
                  {(retryAttempt || 0) > 0 && ` (after ${retryAttempt} retry attempt${(retryAttempt || 0) > 1 ? 's' : ''})`}
                </p>
                {pageFailures && pageFailures.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {pageFailures.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                        {f.pageLabel} · {f.device} · {f.errorCode}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-amber-600 mt-2">
                  Successfully audited results are complete. Go to the{' '}
                  <Link href="/audit/progress" className="underline font-semibold hover:text-amber-800">
                    progress page
                  </Link>{' '}
                  to retry failed items.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
