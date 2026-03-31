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
  'pass': { label: 'Passed', color: 'border', icon: CheckCircle2 },
  'fail': { label: 'Failed', color: 'border', icon: XCircle },
  'warning': { label: 'Warning', color: 'border', icon: AlertTriangle },
  'manual': { label: 'Manual Check', color: 'border', icon: HelpCircle },
  'not-applicable': { label: 'N/A', color: 'text-muted-foreground bg-secondary border-border', icon: MinusCircle },
  'informative': { label: 'Info', color: 'text-muted-foreground bg-secondary border-border', icon: Info },
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

  const renderFilterButton = (type: FilterType, label: string) => (
    <button
      key={type}
      onClick={() => setFilter(type)}
      className={cn(
        "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all",
        filter === type
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-card text-muted-foreground hover:bg-secondary border border-border"
      )}
    >
      {label}
      <span className={cn(
        "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
        filter === type ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
      )}>
        {getFilterCount(type)}
      </span>
    </button>
  );

  return (
    <Card className="rounded-xl shadow-sm border-border overflow-hidden">
      <CardHeader className="pb-3 pt-4 bg-secondary/50 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[14px] font-bold tracking-wide text-foreground uppercase">
              Diagnose Performance Issues
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pageLabel} · {device === 'mobile' ? 'Mobile' : 'Desktop'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {renderFilterButton('all', 'All')}
            {renderFilterButton('failed', 'Failed')}
            {renderFilterButton('warning', 'Warnings')}
            {renderFilterButton('passed', 'Passed')}
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search diagnostic items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm border-border bg-card"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredDiagnostics.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Info className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
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
                  <AccordionItem key={group} value={group} className="border-b border-border">
                    <AccordionTrigger className="hover:no-underline py-4 px-4 hover:bg-secondary">
                      <div className="flex items-center gap-3 w-full pr-4">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{config.label}</span>
                            <span className="text-xs text-muted-foreground">({items.length})</span>
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
                      <div className="divide-y divide-border">
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
    <div className="p-4 pl-16 hover:bg-secondary/50 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className="h-6 w-6 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `var(${statusConfig.bgVar})` }}
        >
          <StatusIcon className="h-3.5 w-3.5" style={{ color: `var(${statusConfig.colorVar})` }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-foreground text-sm">{item.title}</h4>
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wider shrink-0 border-transparent"
              style={{ background: `var(${statusConfig.bgVar})`, color: `var(${statusConfig.colorVar})` }}
            >
              {statusConfig.label}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>

          {(item.displayValue || item.savings) && (
            <div className="flex items-center gap-3 mt-2">
              {item.displayValue && (
                <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded">
                  {item.displayValue}
                </span>
              )}
              {item.savings && (
                <span className="text-xs font-medium px-2 py-0.5 rounded flex items-center" style={{ color: 'var(--green-text)', background: 'var(--green-bg)' }}>
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
            <div className="mt-4 p-3 rounded-lg border" style={{ background: 'var(--blue-bg)', borderColor: 'color-mix(in srgb, var(--blue-text) 15%, transparent)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5" style={{ color: 'var(--blue-text)' }}>
                  <Zap className="h-3 w-3" />
                  Recommended Fix
                </p>
                {item.suggestedOwner && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-black uppercase tracking-tighter border-none" style={{ background: 'color-mix(in srgb, var(--blue-text) 20%, transparent)', color: 'var(--blue-text)' }}>
                    Owner: {item.suggestedOwner}
                  </Badge>
                )}
              </div>
              <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--blue-text)' }}>
                {item.recommendation}
              </p>
              {item.whyItMatters && (
                <p className="text-[10px] mt-1.5 italic" style={{ color: 'var(--blue-text)', opacity: 0.75 }}>
                  Why it matters: {item.whyItMatters}
                </p>
              )}
            </div>
          )}

          {item.details && (
            <div className="mt-3">
              <details className="text-xs group">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest text-[9px] flex items-center gap-1 transition-colors">
                  <FileCode className="h-3 w-3" />
                  View Technical Details
                </summary>
                <div className="mt-2 rounded-lg overflow-auto max-h-72 border border-border">
                  <FormattedDetails details={item.details} />
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormattedDetails({ details }: { details: string }) {
  // Try to parse as JSON and render as a readable table
  try {
    const parsed = JSON.parse(details);

    // Handle array of objects (most common — e.g. list of resources)
    if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
      const items = parsed.items;
      const headings: { key: string; label: string }[] = (parsed.headings || [])
        .filter((h: any) => h?.key && h.key !== 'node')
        .map((h: any) => ({ key: h.key, label: h.label || h.key }));

      // If we have headings, render a table
      if (headings.length > 0) {
        return (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-secondary border-b border-border">
                {headings.map(h => (
                  <th key={h.key} className="text-left px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 20).map((item: any, idx: number) => (
                <tr key={idx} className={cn("border-b border-border last:border-0", idx % 2 === 0 ? "bg-card" : "bg-secondary/30")}>
                  {headings.map(h => (
                    <td key={h.key} className="px-3 py-2 text-foreground/80 font-mono break-all max-w-[300px]">
                      {formatCellValue(item[h.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {items.length > 20 && (
              <tfoot>
                <tr><td colSpan={headings.length} className="px-3 py-2 text-muted-foreground text-center text-[10px]">
                  ...and {items.length - 20} more items
                </td></tr>
              </tfoot>
            )}
          </table>
        );
      }
    }

    // Handle plain array of objects without headings
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
      const keys = Object.keys(parsed[0]).filter(k => k !== 'node');
      return (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-secondary border-b border-border">
              {keys.map(k => (
                <th key={k} className="text-left px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.slice(0, 20).map((item: any, idx: number) => (
              <tr key={idx} className={cn("border-b border-border last:border-0", idx % 2 === 0 ? "bg-card" : "bg-secondary/30")}>
                {keys.map(k => (
                  <td key={k} className="px-3 py-2 text-foreground/80 font-mono break-all max-w-[300px]">
                    {formatCellValue(item[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    // Fallback: pretty-print JSON
    return (
      <pre className="p-3 bg-secondary text-foreground/80 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {
    // Not JSON — render as plain text
    return (
      <div className="p-3 bg-secondary text-foreground/80 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
        {details}
      </div>
    );
  }
}

function formatCellValue(val: any): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (val >= 1024 * 1024) return `${(val / (1024 * 1024)).toFixed(1)} MB`;
    if (val >= 1024) return `${(val / 1024).toFixed(1)} KB`;
    if (val > 0 && val < 1) return val.toFixed(3);
    if (Number.isInteger(val)) return val.toLocaleString();
    return val.toFixed(1);
  }
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function getStatusConfig(status: DiagnosticStatus) {
  switch (status) {
    case 'pass':
      return {
        label: 'Passed',
        icon: CheckCircle2,
        colorVar: '--green-text',
        bgVar: '--green-bg',
      };
    case 'fail':
      return {
        label: 'Failed',
        icon: XCircle,
        colorVar: '--red-text',
        bgVar: '--red-bg',
      };
    case 'warning':
      return {
        label: 'Warning',
        icon: AlertTriangle,
        colorVar: '--amber-text',
        bgVar: '--amber-bg',
      };
    case 'manual':
      return {
        label: 'Manual',
        icon: HelpCircle,
        colorVar: '--blue-text',
        bgVar: '--blue-bg',
      };
    case 'not-applicable':
      return {
        label: 'N/A',
        icon: MinusCircle,
        colorVar: '--muted-foreground',
        bgVar: '--muted',
      };
    default:
      return {
        label: 'Info',
        icon: Info,
        colorVar: '--muted-foreground',
        bgVar: '--muted',
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
