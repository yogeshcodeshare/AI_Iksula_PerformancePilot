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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs font-bold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Health: <span className="font-bold text-foreground">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs font-bold text-foreground">{payload[0].name}</p>
          <p className="text-xs text-muted-foreground">Count: <span className="font-bold text-foreground">{payload[0].value}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Status Distribution Pie Chart */}
      <Card className="rounded-xl shadow-sm border-border col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="h-52 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="donut-glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  cornerRadius={4}
                  strokeWidth={0}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={renderPieTooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-foreground">{metrics.length}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Metrics</span>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2.5">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-card" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}40` }} />
                  <span className="text-xs font-semibold text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-black text-foreground tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Page Health Bar Chart */}
      <Card className="rounded-xl shadow-sm border-border col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Health Score by Page</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pageHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} className="fill-muted-foreground" />
                <YAxis domain={[0, 100]} fontSize={10} axisLine={false} tickLine={false} className="fill-muted-foreground" />
                <Tooltip
                  content={renderBarTooltip}
                  cursor={{ fill: 'var(--color-secondary)', opacity: 0.5 }}
                />
                <Bar dataKey="health" radius={[6, 6, 0, 0]} barSize={36}>
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
