'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Info, Activity, Zap, ShieldCheck, CheckCircle2, Globe } from 'lucide-react';
import { AuditPage, MetricResult, CategoryScore, DiagnosticItem, CWVAssessment, CategoryName } from '@/types';
import { CategoryScoreCards } from './CategoryScoreCards';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { cn } from '@/lib/utils';

interface DiagnosticWorkspaceProps {
  pages: AuditPage[];
  metrics: MetricResult[];
  categoryScores: CategoryScore[];
  diagnostics: DiagnosticItem[];
  cwvAssessments: CWVAssessment[];
  workspacePage: string;
  setWorkspacePage: (id: string) => void;
  workspaceDevice: 'mobile' | 'desktop';
  setWorkspaceDevice: (d: 'mobile' | 'desktop') => void;
  workspaceCategory: CategoryName;
  setWorkspaceCategory: (c: CategoryName) => void;
  actPage: AuditPage | null;
  actMetrics: MetricResult[];
  actCategoryScores: CategoryScore[];
  actCWVAssessment: CWVAssessment | null;
  actSourceUsed: string;
  actFallbackTriggered: boolean;
  actFallbackReason?: string;
  baselineCategoryScores?: CategoryScore[];
}

export function DiagnosticWorkspace({
  pages,
  metrics,
  categoryScores,
  diagnostics,
  cwvAssessments,
  workspacePage,
  setWorkspacePage,
  workspaceDevice,
  setWorkspaceDevice,
  workspaceCategory,
  setWorkspaceCategory,
  actPage,
  actMetrics,
  actCategoryScores,
  actCWVAssessment,
  actSourceUsed,
  actFallbackTriggered,
  actFallbackReason,
  baselineCategoryScores = []
}: DiagnosticWorkspaceProps) {
  return (
    <Card className="rounded-xl shadow-sm border-border" id="diagnostic-workspace">
      <CardHeader className="bg-card border-b border-border flex flex-row items-center justify-between py-5 px-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg text-primary-foreground shadow-sm">
            <Activity className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-widest text-muted-foreground uppercase leading-none">Diagnostic Workspace</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <Select value={workspacePage} onValueChange={setWorkspacePage}>
            <SelectTrigger className="w-[200px] h-9 bg-secondary border-border text-xs font-bold uppercase tracking-tight">
              <SelectValue placeholder="Select page" />
            </SelectTrigger>
            <SelectContent className="border-border shadow-xl rounded-lg">
              {pages.map(p => (
                <SelectItem key={p.pageId} value={p.pageId} className="text-xs font-bold uppercase tracking-tight py-2.5">
                  {p.pageLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={workspaceDevice} onValueChange={(v) => setWorkspaceDevice(v as any)} className="bg-secondary p-1 rounded-lg border border-border h-9">
            <TabsList className="bg-transparent border-none gap-1 h-full">
              <TabsTrigger value="mobile" className="h-7 text-[10px] font-black uppercase tracking-widest px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">
                <Smartphone className="h-3 w-3 mr-1" />
                Mobile
              </TabsTrigger>
              <TabsTrigger value="desktop" className="h-7 text-[10px] font-black uppercase tracking-widest px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">
                <Monitor className="h-3 w-3 mr-1" />
                Desktop
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Diagnostic Meta Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-[22px] font-black text-foreground tracking-tight">{actPage?.pageLabel}</h3>
              <Badge variant="outline" className="h-6 bg-secondary border-border text-muted-foreground font-bold text-[9px] uppercase tracking-widest">
                {actPage?.pageType}
              </Badge>
            </div>
            <p className="text-xs font-mono text-muted-foreground group flex items-center gap-1.5 hover:text-blue-500 transition-colors cursor-pointer">
              {actPage?.url}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Data Source</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <Badge className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                  actSourceUsed === 'lighthouse' ? "bg-blue-600 text-white" : "bg-primary text-primary-foreground"
                )}>
                  {actSourceUsed}
                </Badge>
                {actFallbackTriggered && (
                  <div className="group relative">
                    <Info className="h-4 w-4 text-amber-500 cursor-help" />
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-primary text-primary-foreground text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none font-medium leading-relaxed">
                      Lighthouse fallback used: {actFallbackReason}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: PageSpeed Metrics */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-none">Metrics</h4>
            <div className="flex-1 h-[1px] bg-border" />
          </div>
          <PageSpeedMetrics
            diagnostics={diagnostics}
            pageId={actPage?.pageId || ''}
            device={workspaceDevice}
          />
        </div>

        {/* Section 2: Category Scores */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-none">Diagnostic Scores</h4>
            <div className="flex-1 h-[1px] bg-border" />
          </div>
          <CategoryScoreCards 
            scores={actCategoryScores} 
            baselineScores={baselineCategoryScores}
            device={workspaceDevice}
            activeCategory={workspaceCategory}
            onCategoryClick={(cat) => setWorkspaceCategory(cat as CategoryName)}
          />
        </div>

        {/* Section 3: Diagnostic Insights */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-none">Diagnostic Insights</h4>
            <div className="flex-1 h-[1px] bg-border" />
          </div>

          {/* Category tabs — 4-column grid aligned with score cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {([
              { value: 'performance' as CategoryName, label: 'Performance', icon: Zap, activeColor: 'text-amber-500' },
              { value: 'accessibility' as CategoryName, label: 'Accessibility', icon: ShieldCheck, activeColor: 'text-blue-500' },
              { value: 'best-practices' as CategoryName, label: 'Best Practices', icon: CheckCircle2, activeColor: 'text-green-500' },
              { value: 'seo' as CategoryName, label: 'SEO', icon: Globe, activeColor: 'text-indigo-500' },
            ]).map(tab => {
              const isActive = workspaceCategory === tab.value;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setWorkspaceCategory(tab.value)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <TabIcon className={cn("h-4 w-4", isActive ? "text-current" : tab.activeColor)} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <DiagnosticsPanel 
            diagnostics={diagnostics}
            category={workspaceCategory}
            device={workspaceDevice}
            pageLabel={actPage?.pageLabel || ''}
            pageId={actPage?.pageId || ''}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// PageSpeed performance metrics — 5-column horizontal layout matching CWV assessment style
const PAGESPEED_METRICS = [
  { auditKey: 'largest-contentful-paint', short: 'LCP' },
  { auditKey: 'first-contentful-paint', short: 'FCP' },
  { auditKey: 'total-blocking-time', short: 'TBT' },
  { auditKey: 'cumulative-layout-shift', short: 'CLS' },
  { auditKey: 'speed-index', short: 'SI' },
];

function getScorePillColors(score: number | undefined): { text: string; bg: string; border: string } {
  if (score === undefined) return { text: 'text-muted-foreground', bg: 'bg-secondary', border: 'border-border' };
  if (score >= 90) return { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40', border: 'border-green-200 dark:border-green-800' };
  if (score >= 50) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' };
  return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800' };
}

function PageSpeedMetrics({
  diagnostics,
  pageId,
  device,
}: {
  diagnostics: DiagnosticItem[];
  pageId: string;
  device: 'mobile' | 'desktop';
}) {
  const items = PAGESPEED_METRICS.map(m => {
    const diag = diagnostics.find(
      d => d.auditKey === m.auditKey && d.pageId === pageId && d.device === device
    ) || diagnostics.find(
      d => d.auditKey === m.auditKey && d.device === device
    );
    return {
      ...m,
      displayValue: diag?.displayValue || '—',
      score: diag?.score,
    };
  });

  return (
    <div className="grid grid-cols-5 divide-x divide-border border border-border rounded-xl overflow-hidden bg-card">
      {items.map(item => {
        const colors = getScorePillColors(item.score);
        return (
          <div key={item.auditKey} className="flex flex-col items-center justify-center py-5 px-2 gap-2.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.short}</span>
            <span className={cn(
              "inline-flex items-center px-3.5 py-1.5 rounded-full border text-sm font-bold tabular-nums",
              colors.text, colors.bg, colors.border
            )}>
              {item.displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}
