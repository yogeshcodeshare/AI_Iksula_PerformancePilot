'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DiagnosticItem,
  CategoryName,
  Device,
  DiagnosticGroup,
  DiagnosticStatus
} from '@/types';
import {
  Zap,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  MinusCircle,
  Info,
  ChevronRight,
  ArrowUpRight,
  Clock,
  FileCode,
  Image,
  Layout,
  Globe,
  Shield,
  Eye,
  Volume2,
  Navigation,
  MousePointerClick,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DiagnosticsPanelProps {
  diagnostics: DiagnosticItem[];
  category: CategoryName;
  device: Device;
  pageLabel: string;
  pageId: string;
}

type FilterType = 'all' | 'failed' | 'warning' | 'passed' | 'manual';

const groupConfig: Record<string, { label: string; icon: React.ElementType; order: number }> = {
  // Performance groups
  'insights': { label: 'Insights', icon: ArrowUpRight, order: 1 },
  'diagnostics': { label: 'Diagnostics', icon: AlertCircle, order: 2 },
  'passed': { label: 'Passed Audits', icon: CheckCircle2, order: 3 },

  // Accessibility groups
  'aria': { label: 'ARIA', icon: Eye, order: 1 },
  'names-labels': { label: 'Names and Labels', icon: MousePointerClick, order: 2 },
  'navigation': { label: 'Navigation', icon: Navigation, order: 3 },
  'audio-video': { label: 'Audio and Video', icon: Volume2, order: 4 },
  'best-practices': { label: 'Best Practices', icon: Shield, order: 5 },
  'manual-checks': { label: 'Manual Checks', icon: HelpCircle, order: 6 },
  'not-applicable': { label: 'Not Applicable', icon: MinusCircle, order: 7 },

  // Best Practices groups
  'general': { label: 'General', icon: CheckCircle2, order: 1 },
  'trust-safety': { label: 'Trust and Safety', icon: Shield, order: 2 },

  // SEO groups
  'crawling-indexing': { label: 'Crawling and Indexing', icon: Globe, order: 1 },
  'seo-manual-checks': { label: 'Manual Checks', icon: HelpCircle, order: 2 },
};

const statusConfig: Record<DiagnosticStatus, { label: string; color: string; icon: React.ElementType }> = {
  'pass': { label: 'Passed', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2 },
  'fail': { label: 'Failed', color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
  'warning': { label: 'Warning', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: AlertTriangle },
  'manual': { label: 'Manual Check', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: HelpCircle },
  'not-applicable': { label: 'N/A', color: 'text-slate-400 bg-slate-50 border-slate-200', icon: MinusCircle },
  'informative': { label: 'Info', color: 'text-slate-600 bg-slate-50 border-slate-200', icon: Info },
};

export function DiagnosticsPanel({
  diagnostics,
  category,
  device,
  pageLabel,
  pageId
}: DiagnosticsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Filter diagnostics by pageId, category, device, search, and status filter
  const filteredDiagnostics = useMemo(() => {
    return diagnostics.filter(d => {
      // Must match current page, category, and device
      if (d.pageId !== pageId) return false;
      if (d.category !== category || d.device !== device) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          d.title.toLowerCase().includes(query) ||
          d.description.toLowerCase().includes(query) ||
          d.auditKey.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filter === 'failed' && d.status !== 'fail') return false;
      if (filter === 'warning' && d.status !== 'warning') return false;
      if (filter === 'passed' && d.status !== 'pass') return false;
      if (filter === 'manual' && d.status !== 'manual') return false;

      return true;
    });
  }, [diagnostics, pageId, category, device, searchQuery, filter]);

  // Group diagnostics
  const groupedDiagnostics = useMemo(() => {
    const groups = new Map<string, DiagnosticItem[]>();

    filteredDiagnostics.forEach(d => {
      const group = d.group || 'other';
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(d);
    });

    // Sort groups by order
    return Array.from(groups.entries()).sort((a, b) => {
      const orderA = groupConfig[a[0]]?.order || 99;
      const orderB = groupConfig[b[0]]?.order || 99;
      return orderA - orderB;
    });
  }, [filteredDiagnostics]);

  // Count by status (for the active page/category/device)
  const statusCounts = useMemo(() => {
    const counts = { fail: 0, warning: 0, pass: 0, manual: 0, other: 0 };
    diagnostics
      .filter(d => d.pageId === pageId && d.category === category && d.device === device)
      .forEach(d => {
        if (d.status === 'fail') counts.fail++;
        else if (d.status === 'warning') counts.warning++;
        else if (d.status === 'pass') counts.pass++;
        else if (d.status === 'manual') counts.manual++;
        else counts.other++;
      });
    return counts;
  }, [diagnostics, pageId, category, device]);

  const getFilterCount = (filterType: FilterType): number => {
    switch (filterType) {
      case 'failed': return statusCounts.fail;
      case 'warning': return statusCounts.warning;
      case 'passed': return statusCounts.pass;
      case 'manual': return statusCounts.manual;
      default: return filteredDiagnostics.length;
    }
  };

  const FilterButton = ({ type, label }: { type: FilterType; label: string }) => (
    <button
      onClick={() => setFilter(type)}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        filter === type
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
      )}
    >
      {label}
      <span className={cn(
        "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
        filter === type ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500"
      )}>
        {getFilterCount(type)}
      </span>
    </button>
  );

  return (
    <Card className="rounded-xl shadow-sm border-slate-200 overflow-hidden">
      <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-bold tracking-widest text-slate-500 uppercase">
              Diagnose Performance Issues
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              {pageLabel} · {device === 'mobile' ? 'Mobile' : 'Desktop'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <FilterButton type="all" label="All" />
            <FilterButton type="failed" label="Failed" />
            <FilterButton type="warning" label="Warnings" />
            <FilterButton type="passed" label="Passed" />
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search diagnostic items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm border-slate-200 bg-white"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredDiagnostics.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Info className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No diagnostic items found for this filter.</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 text-xs mt-2 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Accordion type="multiple" className="w-full">
              {groupedDiagnostics.map(([group, items]) => {
                const config = groupConfig[group] || {
                  label: group.charAt(0).toUpperCase() + group.slice(1).replace(/-/g, ' '),
                  icon: FileCode,
                  order: 99
                };
                const Icon = config.icon;
                const failCount = items.filter(i => i.status === 'fail').length;
                const warnCount = items.filter(i => i.status === 'warning').length;

                return (
                  <AccordionItem key={group} value={group} className="border-b border-slate-100">
                    <AccordionTrigger className="hover:no-underline py-4 px-4 hover:bg-slate-50">
                      <div className="flex items-center gap-3 w-full pr-4">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{config.label}</span>
                            <span className="text-xs text-slate-400">({items.length})</span>
                          </div>
                        </div>
                        {(failCount > 0 || warnCount > 0) && (
                          <div className="flex items-center gap-1.5">
                            {failCount > 0 && (
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                {failCount} failed
                              </Badge>
                            )}
                            {warnCount > 0 && (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                                {warnCount} warnings
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="divide-y divide-slate-50">
                        {items.map((item) => (
                          <DiagnosticItemRow key={item.id} item={item} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function DiagnosticItemRow({ item }: { item: DiagnosticItem }) {
  const statusConfig = getStatusConfig(item.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-4 pl-16 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn(
          "h-6 w-6 rounded flex items-center justify-center shrink-0 mt-0.5",
          statusConfig.bgColor
        )}>
          <StatusIcon className={cn("h-3.5 w-3.5", statusConfig.textColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-slate-900 text-sm">{item.title}</h4>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] uppercase tracking-wider shrink-0",
                statusConfig.badgeClass
              )}
            >
              {statusConfig.label}
            </Badge>
          </div>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>

          {(item.displayValue || item.savings) && (
            <div className="flex items-center gap-3 mt-2">
              {item.displayValue && (
                <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {item.displayValue}
                </span>
              )}
              {item.savings && (
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Save {formatSavings(item.savings, item.savingsUnit)}
                </span>
              )}
            </div>
          )}

          {item.warnings && item.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {item.warnings.map((warning, idx) => (
                <p key={idx} className="text-xs text-amber-600 flex items-start">
                  <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 shrink-0" />
                  {warning}
                </p>
              ))}
            </div>
          )}

          {item.recommendation && (
            <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100/50 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-black text-blue-900 uppercase tracking-tighter flex items-center gap-1.5">
                  <Zap className="h-3 w-3" />
                  Recommended Fix
                </p>
                {item.suggestedOwner && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-black uppercase tracking-tighter bg-blue-100 text-blue-700">
                    Owner: {item.suggestedOwner}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-blue-800 font-semibold leading-relaxed">
                {item.recommendation}
              </p>
              {item.whyItMatters && (
                <p className="text-[10px] text-blue-600/80 mt-1.5 italic">
                  Why it matters: {item.whyItMatters}
                </p>
              )}
            </div>
          )}

          {item.details && (
            <div className="mt-3">
              <details className="text-xs group">
                <summary className="cursor-pointer text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1">
                  <FileCode className="h-3 w-3" />
                  View Technical Details
                </summary>
                <div className="mt-2 p-3 bg-slate-900 text-slate-300 font-mono text-[10px] rounded-lg overflow-auto max-h-48 border border-slate-800 shadow-inner">
                  {item.details}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusConfig(status: DiagnosticStatus) {
  switch (status) {
    case 'pass':
      return {
        label: 'Passed',
        icon: CheckCircle2,
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
        badgeClass: 'border-green-200 text-green-700 bg-green-50'
      };
    case 'fail':
      return {
        label: 'Failed',
        icon: XCircle,
        textColor: 'text-red-600',
        bgColor: 'bg-red-50',
        badgeClass: 'border-red-200 text-red-700 bg-red-50'
      };
    case 'warning':
      return {
        label: 'Warning',
        icon: AlertTriangle,
        textColor: 'text-amber-600',
        bgColor: 'bg-amber-50',
        badgeClass: 'border-amber-200 text-amber-700 bg-amber-50'
      };
    case 'manual':
      return {
        label: 'Manual',
        icon: HelpCircle,
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
        badgeClass: 'border-blue-200 text-blue-700 bg-blue-50'
      };
    case 'not-applicable':
      return {
        label: 'N/A',
        icon: MinusCircle,
        textColor: 'text-slate-400',
        bgColor: 'bg-slate-50',
        badgeClass: 'border-slate-200 text-slate-500 bg-slate-50'
      };
    default:
      return {
        label: 'Info',
        icon: Info,
        textColor: 'text-slate-600',
        bgColor: 'bg-slate-50',
        badgeClass: 'border-slate-200 text-slate-600 bg-slate-50'
      };
  }
}

function formatSavings(value: number, unit?: 'ms' | 'bytes'): string {
  if (!unit) return String(value);

  if (unit === 'ms') {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} s`;
    }
    return `${Math.round(value)} ms`;
  }

  if (unit === 'bytes') {
    if (value >= 1024 * 1024) {
      return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (value >= 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }
    return `${value} B`;
  }

  return String(value);
}
