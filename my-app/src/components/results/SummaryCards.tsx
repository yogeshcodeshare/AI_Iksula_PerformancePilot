'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, XCircle, Activity, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { MetricResult } from '@/types';
import { calculateOverallHealth } from '@/lib/utils';

interface SummaryCardsProps {
  metrics: MetricResult[];
  pageCount: number;
  baselineMetrics?: MetricResult[];
}

export function SummaryCards({ metrics, pageCount, baselineMetrics }: SummaryCardsProps) {
  const goodCount = metrics.filter(m => m.status === 'good').length;
  const warnCount = metrics.filter(m => m.status === 'needs-improvement').length;
  const poorCount = metrics.filter(m => m.status === 'poor').length;
  const overallHealth = calculateOverallHealth(metrics);
  const fallbackCount = metrics.filter(m => m.fallbackTriggered).length;

  // Health delta from comparison
  const baselineHealth = baselineMetrics ? calculateOverallHealth(baselineMetrics) : null;
  const healthDelta = baselineHealth !== null ? overallHealth - baselineHealth : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {/* Overall Health Score Card — spans 2 cols on lg */}
      <Card className="rounded-xl shadow-sm border-border bg-card overflow-hidden group hover:shadow-md transition-shadow lg:col-span-2">
        <CardContent className="p-7">
          <div className="flex items-center gap-8">
            {/* Health gauge */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="5" className="stroke-border" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" strokeWidth="6"
                    stroke={overallHealth >= 80 ? '#22c55e' : overallHealth >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeLinecap="round"
                    strokeDasharray={`${(overallHealth / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                    style={{ filter: `drop-shadow(0 0 6px ${overallHealth >= 80 ? '#22c55e40' : overallHealth >= 50 ? '#f59e0b40' : '#ef444440'})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-foreground tracking-tight">{overallHealth}%</span>
                </div>
              </div>
              <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mt-2">Overall Health</p>
              {healthDelta !== null && healthDelta !== 0 && (
                <div className={`flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  healthDelta > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {healthDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {healthDelta > 0 ? '+' : ''}{healthDelta}%
                </div>
              )}
            </div>

            {/* Audit Scope info */}
            <div className="flex-1 border-l border-border pl-8 space-y-4">
              <div>
                <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Audit Scope</p>
                <div className="flex items-baseline gap-3 mt-1.5">
                  <h3 className="text-5xl font-black text-foreground tracking-tight">{pageCount}</h3>
                  <span className="text-base font-medium text-muted-foreground">Pages Audited</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-md border border-border">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold text-muted-foreground tracking-tight uppercase">PSI v5</span>
                </div>
                <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-md border border-border">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-muted-foreground tracking-tight uppercase">Mobile + Desktop</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CWV Performance Distribution Card */}
      <Card className="rounded-xl shadow-sm border-border bg-card group hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">CWV Metrics Distribution</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-green-500/10 p-2.5 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-bold text-green-500 tracking-tight uppercase">Good</span>
              </div>
              <span className="text-sm font-black text-green-500">{goodCount}</span>
            </div>
            <div className="flex justify-between items-center bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-500 tracking-tight uppercase">Needs Imp.</span>
              </div>
              <span className="text-sm font-black text-amber-500">{warnCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical & Reliability Card */}
      <Card className="rounded-xl shadow-sm border-border bg-card group hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">Critical & Reliability</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-bold text-red-500 tracking-tight uppercase">Poor Results</span>
              </div>
              <span className="text-sm font-black text-red-500">{poorCount}</span>
            </div>
            <div className="flex justify-between items-center bg-secondary p-2.5 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground tracking-tight uppercase">Fallbacks</span>
              </div>
              <span className="text-sm font-black text-foreground">{fallbackCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
