'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MetricResult, AuditPage } from '@/types';
import { calculateOverallHealth } from '@/lib/utils';

interface ResultsChartsSectionProps {
  metrics: MetricResult[];
  pages: AuditPage[];
}

export function ResultsChartsSection({ metrics, pages }: ResultsChartsSectionProps) {
  const goodCount = metrics.filter(m => m.status === 'good').length;
  const warnCount = metrics.filter(m => m.status === 'needs-improvement').length;
  const poorCount = metrics.filter(m => m.status === 'poor').length;

  const statusData = [
    { name: 'Good', value: goodCount, color: '#22c55e' },
    { name: 'Needs Improvement', value: warnCount, color: '#eab308' },
    { name: 'Poor', value: poorCount, color: '#ef4444' },
  ];

  const pageHealthData = pages.map(page => {
    const pageMetrics = metrics.filter(m => m.pageId === page.pageId);
    const health = calculateOverallHealth(pageMetrics);
    const hasFailed = pageMetrics.some(m => m.status === 'poor');
    const hasNoData = pageMetrics.length === 0;
    return {
      name: page.pageLabel.substring(0, 15),
      health,
      hasFailed,
      hasNoData,
      color: hasNoData ? '#cbd5e1' : health >= 80 ? '#22c55e' : health >= 50 ? '#f59e0b' : '#ef4444'
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Status Distribution Pie Chart */}
      <Card className="rounded-xl shadow-sm border-slate-200 col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold tracking-widest text-slate-500 uppercase">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">{metrics.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Metrics</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Page Health Bar Chart */}
      <Card className="rounded-xl shadow-sm border-slate-200 col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold tracking-widest text-slate-500 uppercase">Health Score by Page</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pageHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis domain={[0, 100]} fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="health" radius={[4, 4, 0, 0]} barSize={32}>
                  {pageHealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
