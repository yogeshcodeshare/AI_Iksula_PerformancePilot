'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Smartphone, Monitor, AlertCircle, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';
import { AuditPage, MetricResult, Device, ComparisonResult } from '@/types';
import { StatusFilter } from '@/hooks/useResultsFilters';
import { formatMetricValue, getStatusColor, getStatusTextColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MetricsMatrixProps {
  pages: AuditPage[];
  metrics: MetricResult[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (s: StatusFilter) => void;
  showFilterMenu: boolean;
  setShowFilterMenu: (s: boolean) => void;
  onViewDetails: (pageId: string, device: Device) => void;
  comparison?: ComparisonResult | null;
}

const METRICS: Array<{ key: string; label: string }> = [
  { key: 'LCP',  label: 'LCP'  },
  { key: 'INP',  label: 'INP'  },
  { key: 'CLS',  label: 'CLS'  },
  { key: 'FCP',  label: 'FCP'  },
  { key: 'TTFB', label: 'TTFB' },
];

export function MetricsMatrix({
  pages,
  metrics,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  showFilterMenu,
  setShowFilterMenu,
  onViewDetails,
  comparison,
}: MetricsMatrixProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device>('mobile');

  const filteredPages = pages.filter(p =>
    p.pageLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // For status filter: keep pages that have at least one metric matching the filter for the selected device
  const displayedPages = statusFilter === 'all'
    ? filteredPages
    : filteredPages.filter(p =>
        metrics.some(m =>
          m.pageId === p.pageId &&
          m.device === selectedDevice &&
          m.status === statusFilter
        )
      );

  return (
    <Card className="rounded-xl shadow-sm border-border mb-8 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <CardHeader className="bg-card border-b border-border py-5 px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-primary-foreground shadow-sm">
              <Search className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
              Detailed Results Matrix
            </CardTitle>
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {/* Device Tabs — matching DiagnosticWorkspace style */}
            <Tabs
              value={selectedDevice}
              onValueChange={(v) => setSelectedDevice(v as Device)}
              className="bg-secondary p-1 rounded-lg border border-border h-9"
            >
              <TabsList className="bg-transparent border-none gap-1">
                <TabsTrigger
                  value="mobile"
                  className="h-7 text-[10px] font-black uppercase tracking-widest px-3
                             data-[state=active]:bg-card data-[state=active]:shadow-sm
                             data-[state=active]:text-foreground text-muted-foreground"
                >
                  <Smartphone className="h-3 w-3 mr-1" />
                  Mobile
                </TabsTrigger>
                <TabsTrigger
                  value="desktop"
                  className="h-7 text-[10px] font-black uppercase tracking-widest px-3
                             data-[state=active]:bg-card data-[state=active]:shadow-sm
                             data-[state=active]:text-foreground text-muted-foreground"
                >
                  <Monitor className="h-3 w-3 mr-1" />
                  Desktop
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-52 h-9 bg-secondary border-border focus:bg-card transition-all text-sm rounded-lg"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 border-border transition-colors gap-2 font-semibold",
                  statusFilter !== 'all'
                    ? "bg-muted text-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
                onClick={() => setShowFilterMenu(!showFilterMenu)}
              >
                <Filter className="h-3.5 w-3.5" />
                {statusFilter === 'all' ? 'All Status' : statusFilter.replace('-', ' ').toUpperCase()}
              </Button>
              {showFilterMenu && (
                <div className="absolute right-0 top-10 w-44 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in duration-150">
                  {(['all', 'good', 'needs-improvement', 'poor'] as StatusFilter[]).map((f) => (
                    <button
                      key={f}
                      className={cn(
                        "w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-tight hover:bg-secondary transition-colors",
                        statusFilter === f ? "text-foreground bg-secondary" : "text-muted-foreground"
                      )}
                      onClick={() => {
                        setStatusFilter(f);
                        setShowFilterMenu(false);
                      }}
                    >
                      {f === 'all' ? 'Show All' : f.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Device indicator strip */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <div className={cn(
            "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest",
            selectedDevice === 'mobile' ? "text-foreground" : "text-foreground"
          )}>
            {selectedDevice === 'mobile'
              ? <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
              : <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
            }
            Showing {selectedDevice === 'mobile' ? 'Mobile' : 'Desktop'} results for {displayedPages.length} page{displayedPages.length !== 1 ? 's' : ''}
          </div>
        </div>
      </CardHeader>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="w-[280px] font-bold text-muted-foreground text-[10px] uppercase tracking-widest pl-6">
                Page Label & URL
              </TableHead>
              {METRICS.map(m => (
                <TableHead key={m.key} className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest text-center">
                  {m.label}
                </TableHead>
              ))}
              <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest text-right pr-6">
                Source
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedPages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={METRICS.length + 2} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No pages match your filters</p>
                    <p className="text-xs">Try adjusting the search or status filter</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayedPages.map((page, pIdx) => {
                const rowMetrics = metrics.filter(
                  m => m.pageId === page.pageId && m.device === selectedDevice
                );
                const sourceMetric = rowMetrics[0];

                return (
                  <TableRow
                    key={`${page.pageId}-${selectedDevice}`}
                    className={cn(
                      "hover:bg-secondary/60 transition-colors group cursor-pointer border-b border-border last:border-0",
                      pIdx % 2 === 0 ? "bg-card" : "bg-secondary/20"
                    )}
                    onClick={() => onViewDetails(page.pageId, selectedDevice)}
                  >
                    {/* Page label & URL */}
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-foreground group-hover:text-blue-600 transition-colors text-sm">
                          {page.pageLabel}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[240px]">
                          {page.url}
                        </span>
                      </div>
                    </TableCell>

                    {/* Metric cells */}
                    {METRICS.map(({ key: metricName }) => {
                      const res = rowMetrics.find(m => m.metricName === metricName);
                      // Find matching comparison delta for this page + metric + device
                      const delta = comparison?.deltas.find(
                        d => d.pageKey === page.pageLabel && d.metricName === metricName && d.device === selectedDevice
                      );
                      return (
                        <TableCell key={metricName} className="text-center font-mono px-3">
                          {res ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={cn(
                                "text-[15px] font-black tracking-tight",
                                getStatusTextColor(res.status)
                              )}>
                                {formatMetricValue(res.value, res.metricName)}
                              </span>
                              {delta && delta.deltaDirection !== 'unchanged' && (
                                <span className={cn(
                                  "flex items-center gap-0.5 text-[9px] font-bold",
                                  delta.deltaDirection === 'improved' ? 'text-green-500' : 'text-red-500'
                                )}>
                                  {delta.deltaDirection === 'improved'
                                    ? <TrendingDown className="h-2.5 w-2.5" />
                                    : <TrendingUp className="h-2.5 w-2.5" />
                                  }
                                  {delta.deltaDirection === 'improved' ? '-' : '+'}{formatMetricValue(delta.deltaValue, delta.metricName)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50 font-bold text-sm">—</span>
                          )}
                        </TableCell>
                      );
                    })}

                    {/* Source + arrow */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2 group-hover:translate-x-0.5 transition-transform">
                        {sourceMetric && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[9px] uppercase tracking-tighter font-black rounded h-5 px-1.5",
                              sourceMetric.sourceUsed === 'lighthouse'
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {sourceMetric.sourceUsed}
                          </Badge>
                        )}
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="px-6 py-3 bg-secondary border-t border-border flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground font-medium">
          Click any row to open detailed diagnostics in the Diagnostic Workspace below
        </p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Good
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Needs Improvement
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Poor
          </span>
        </div>
      </div>
    </Card>
  );
}
