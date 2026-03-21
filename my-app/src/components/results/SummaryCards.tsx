'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Zap, Clock, Package } from 'lucide-react';
import { MetricResult } from '@/types';
import { calculateOverallHealth } from '@/lib/utils';

interface SummaryCardsProps {
  metrics: MetricResult[];
  pageCount: number;
}

export function SummaryCards({ metrics, pageCount }: SummaryCardsProps) {
  const goodCount = metrics.filter(m => m.status === 'good').length;
  const warnCount = metrics.filter(m => m.status === 'needs-improvement').length;
  const poorCount = metrics.filter(m => m.status === 'poor').length;
  const overallHealth = calculateOverallHealth(metrics);
  const fallbackCount = metrics.filter(m => m.fallbackTriggered).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Overall Health Score Card */}
      <Card className="rounded-xl shadow-sm border-slate-200 bg-white overflow-hidden group hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
              <Zap className="h-5 w-5" />
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-slate-900 tracking-tight">{overallHealth}%</p>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1">Overall Health</p>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                overallHealth >= 80 ? 'bg-green-500' : overallHealth >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${overallHealth}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Scope Card */}
      <Card className="rounded-xl shadow-sm border-slate-200 bg-white group hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Audit Scope</p>
              <h3 className="text-xl font-bold text-slate-900">{pageCount} Pages</h3>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[11px] font-bold text-slate-600 tracking-tight uppercase">PSI v5</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CWV Performance Distribution Card */}
      <Card className="rounded-xl shadow-sm border-slate-200 bg-white group hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">CWV Metrics Distribution</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-green-50/50 p-2 rounded-lg border border-green-100/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs font-bold text-green-700 tracking-tight uppercase">Good</span>
              </div>
              <span className="text-sm font-black text-green-700">{goodCount}</span>
            </div>
            <div className="flex justify-between items-center bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-bold text-amber-700 tracking-tight uppercase">Needs Imp.</span>
              </div>
              <span className="text-sm font-black text-amber-700">{warnCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical & Reliability Card */}
      <Card className="rounded-xl shadow-sm border-slate-200 bg-white group hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Critical & Reliability</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-red-50/50 p-2 rounded-lg border border-red-100/50">
              <div className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-red-600" />
                <span className="text-xs font-bold text-red-700 tracking-tight uppercase">Poor Results</span>
              </div>
              <span className="text-sm font-black text-red-700">{poorCount}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-slate-600" />
                <span className="text-xs font-bold text-slate-700 tracking-tight uppercase">Fallbacks</span>
              </div>
              <span className="text-sm font-black text-slate-700">{fallbackCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
