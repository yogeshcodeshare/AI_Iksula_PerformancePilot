'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Info, Activity, Zap, ShieldCheck, CheckCircle2, Globe } from 'lucide-react';
import { AuditPage, MetricResult, CategoryScore, DiagnosticItem, CWVAssessment, CategoryName } from '@/types';
import { CWVAssessmentCard } from './CWVAssessmentCard';
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
    <Card className="rounded-xl shadow-sm border-slate-200" id="diagnostic-workspace">
      <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-white shadow-sm">
            <Activity className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-widest text-slate-500 uppercase leading-none">Diagnostic Workspace</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <Select value={workspacePage} onValueChange={setWorkspacePage}>
            <SelectTrigger className="w-[200px] h-9 bg-slate-50 border-slate-200 text-xs font-bold uppercase tracking-tight">
              <SelectValue placeholder="Select page" />
            </SelectTrigger>
            <SelectContent className="border-slate-200 shadow-xl rounded-lg">
              {pages.map(p => (
                <SelectItem key={p.pageId} value={p.pageId} className="text-xs font-bold uppercase tracking-tight py-2.5">
                  {p.pageLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={workspaceDevice} onValueChange={(v) => setWorkspaceDevice(v as any)} className="bg-slate-50 p-1 rounded-lg border border-slate-200 h-9">
            <TabsList className="bg-transparent border-none gap-1">
              <TabsTrigger value="mobile" className="h-7 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900">
                <Smartphone className="h-3 w-3 mr-1" />
                Mobile
              </TabsTrigger>
              <TabsTrigger value="desktop" className="h-7 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900">
                <Monitor className="h-3 w-3 mr-1" />
                Desktop
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {/* Diagnostic Meta Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{actPage?.pageLabel}</h3>
              <Badge variant="outline" className="h-6 bg-slate-50 border-slate-200 text-slate-500 font-bold text-[9px] uppercase tracking-widest">
                {actPage?.pageType}
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-400 group flex items-center gap-1.5 hover:text-blue-500 transition-colors cursor-pointer">
              {actPage?.url}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Source</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <Badge className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                  actSourceUsed === 'lighthouse' ? "bg-blue-600 text-white" : "bg-slate-900 text-white"
                )}>
                  {actSourceUsed}
                </Badge>
                {actFallbackTriggered && (
                  <div className="group relative">
                    <Info className="h-4 w-4 text-amber-500 cursor-help" />
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none font-medium leading-relaxed">
                      Lighthouse fallback used: {actFallbackReason}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Core Web Vitals Assessment */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">CWV Assessment</h4>
            <div className="flex-1 h-[1px] bg-slate-100" />
          </div>
          <CWVAssessmentCard 
            assessment={actCWVAssessment} 
            device={workspaceDevice} 
            pageLabel={actPage?.pageLabel || ''}
            source={(actSourceUsed as any) || 'pagespeed'}
            fallbackTriggered={actFallbackTriggered}
            fallbackReason={actFallbackReason}
          />
        </div>

        {/* Section 2: Category Scores */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Diagnostic Scores</h4>
            <div className="flex-1 h-[1px] bg-slate-100" />
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
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Diagnostic Insights</h4>
            <div className="flex-1 h-[1px] bg-slate-100" />
          </div>
          
          <Tabs 
            value={workspaceCategory} 
            onValueChange={(v) => setWorkspaceCategory(v as CategoryName)}
            className="mb-6"
          >
            <TabsList className="bg-slate-50 border border-slate-200 p-1 w-full md:w-auto h-12 overflow-x-auto scrollbar-hide">
              <TabsTrigger value="performance" className="h-9 px-6 text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 border-none">
                <Zap className={cn("h-3.5 w-3.5", workspaceCategory === 'performance' ? "text-amber-500" : "text-slate-400")} />
                Performance
              </TabsTrigger>
              <TabsTrigger value="accessibility" className="h-9 px-6 text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 border-none">
                <ShieldCheck className={cn("h-3.5 w-3.5", workspaceCategory === 'accessibility' ? "text-blue-500" : "text-slate-400")} />
                Accessibility
              </TabsTrigger>
              <TabsTrigger value="best-practices" className="h-9 px-6 text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 border-none">
                <CheckCircle2 className={cn("h-3.5 w-3.5", workspaceCategory === 'best-practices' ? "text-green-500" : "text-slate-400")} />
                Best Practices
              </TabsTrigger>
              <TabsTrigger value="seo" className="h-9 px-6 text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 border-none">
                <Globe className={cn("h-3.5 w-3.5", workspaceCategory === 'seo' ? "text-indigo-500" : "text-slate-400")} />
                SEO
              </TabsTrigger>
            </TabsList>
          </Tabs>

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
