'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ReportPackage, ComparisonResult, ComparisonDelta, CategoryScoreDelta, CategoryName } from '@/types';
import {
  compareReports,
  generateComparisonSummary,
  getSignificantChanges,
  getSignificantCategoryChanges
} from '@/services/comparison';
import { getBaselineReport, getAuditStateAsync } from '@/services/storage';
import { formatMetricValue, formatDate, calculateOverallHealth, cn } from '@/lib/utils';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Zap,
  ShieldCheck,
  Search,
  Activity,
  Calendar,
  Target
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// jsPDF autoTable extends jsPDF with lastAutoTable at runtime — accessed via cast
type AutoTableDoc = { lastAutoTable: { finalY: number } };

export default function ComparePage() {
  const [baseline, setBaseline] = useState<ReportPackage | null>(null);
  const [current, setCurrent] = useState<ReportPackage | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    const storedBaseline = getBaselineReport();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedBaseline) setBaseline(storedBaseline);

    async function loadCurrent() {
      let currentAudit = null;
      const sessionData = sessionStorage.getItem('current-audit-state');
      if (sessionData) {
        try { currentAudit = JSON.parse(sessionData); } catch { /* ignore */ }
      }
      if (!currentAudit) currentAudit = await getAuditStateAsync();
      if (currentAudit?.run) {
        const pkg: ReportPackage = {
          metadata: {
            schemaVersion: currentAudit.run.schemaVersion,
            appVersion: '1.0.0',
            generatedAt: currentAudit.run.generatedAt,
            thresholdProfile: 'core-web-vitals-default',
            sourcePolicy: 'pagespeed-first-lighthouse-fallback'
          },
          auditRun: currentAudit.run,
          pages: currentAudit.pages,
          metrics: currentAudit.metrics,
          categoryScores: currentAudit.categoryScores || [],
          diagnostics: currentAudit.diagnostics || [],
          cwvAssessments: currentAudit.cwvAssessments || [],
          evidence: []
        };
        setCurrent(pkg);
      }
    }
    loadCurrent();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (baseline && current) setComparison(compareReports(baseline, current));
  }, [baseline, current]);

  if (!baseline || !current) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-700 font-medium mb-2">
            {!baseline ? 'No baseline report loaded' : 'No current audit found'}
          </p>
          <p className="text-sm text-slate-500 mb-6">
            {!baseline
              ? 'Upload a previous audit JSON from the Results page to compare.'
              : 'Run a new audit first, then return here to compare.'}
          </p>
          <Link href="/results">
            <Button variant="outline">Go to Results</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-slate-800 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Comparing reports...</p>
        </div>
      </div>
    );
  }

  const summary = generateComparisonSummary(comparison);
  const regressions = getSignificantChanges(comparison, 'regressed');
  const improvements = getSignificantChanges(comparison, 'improved');
  const categoryRegressions = getSignificantCategoryChanges(comparison, 'regressed');
  const categoryImprovements = getSignificantCategoryChanges(comparison, 'improved');

  const baselineHealth = calculateOverallHealth(baseline.metrics);
  const currentHealth = calculateOverallHealth(current.metrics);
  const healthDelta = currentHealth - baselineHealth;

  const handleDownloadComparisonPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const MARGIN = 15;
    const CONTENT_W = W - MARGIN * 2;

    const setFont = (size: number, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [30, 41, 59]) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(...color);
    };
    const filledRect = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) => {
      doc.setFillColor(r, g, b);
      doc.rect(x, y, w, h, 'F');
    };

    // ── Cover ────────────────────────────────────────────────────────────────
    filledRect(0, 0, W, 55, 15, 23, 42);
    setFont(9, 'bold', [56, 189, 248]);
    doc.text('PERFORMANCE PILOT — COMPARISON REPORT', MARGIN, 14);
    setFont(22, 'bold', [255, 255, 255]);
    doc.text('Audit Comparison', MARGIN, 28);
    setFont(10, 'normal', [148, 163, 184]);
    doc.text(`${comparison.baselineRun.projectName}  |  Generated ${formatDate(new Date().toISOString())}`, MARGIN, 40);

    // Health delta box
    filledRect(W - 62, 10, 47, 35, 30, 41, 59);
    setFont(7, 'bold', [148, 163, 184]);
    doc.text('HEALTH CHANGE', W - 38, 19, { align: 'center' });
    const deltaColor: [number, number, number] = healthDelta > 0 ? [74, 222, 128] : healthDelta < 0 ? [248, 113, 113] : [148, 163, 184];
    setFont(20, 'bold', deltaColor);
    doc.text(`${healthDelta > 0 ? '+' : ''}${healthDelta}%`, W - 38, 34, { align: 'center' });

    let y = 70;

    // ── Run info ─────────────────────────────────────────────────────────────
    filledRect(MARGIN, y, CONTENT_W / 2 - 3, 22, 241, 245, 249);
    filledRect(MARGIN + CONTENT_W / 2 + 3, y, CONTENT_W / 2 - 3, 22, 219, 234, 254);
    setFont(7, 'bold', [100, 116, 139]);
    doc.text('BASELINE', MARGIN + 4, y + 6);
    doc.text('CURRENT', MARGIN + CONTENT_W / 2 + 7, y + 6);
    setFont(9, 'bold', [15, 23, 42]);
    doc.text(comparison.baselineRun.auditLabel, MARGIN + 4, y + 13);
    doc.text(comparison.currentRun.auditLabel, MARGIN + CONTENT_W / 2 + 7, y + 13);
    setFont(7, 'normal', [100, 116, 139]);
    doc.text(formatDate(comparison.baselineRun.generatedAt), MARGIN + 4, y + 19);
    doc.text(formatDate(comparison.currentRun.generatedAt), MARGIN + CONTENT_W / 2 + 7, y + 19);
    y += 30;

    // ── Summary stats ─────────────────────────────────────────────────────────
    setFont(11, 'bold', [15, 23, 42]);
    doc.text('Comparison Summary', MARGIN, y);
    y += 6;

    const cols = CONTENT_W / 4;
    const statItems = [
      { label: 'Compared', value: String(summary.totalCompared), color: [30, 41, 59] as [number,number,number] },
      { label: 'Improved', value: String(summary.improved), color: [21, 128, 61] as [number,number,number] },
      { label: 'Regressed', value: String(summary.regressed), color: [185, 28, 28] as [number,number,number] },
      { label: 'Unchanged', value: String(summary.unchanged), color: [71, 85, 105] as [number,number,number] },
    ];
    statItems.forEach((s, i) => {
      filledRect(MARGIN + i * cols, y, cols - 3, 18, 248, 250, 252);
      setFont(7, 'bold', [100, 116, 139]);
      doc.text(s.label.toUpperCase(), MARGIN + i * cols + 4, y + 6);
      setFont(14, 'bold', s.color);
      doc.text(s.value, MARGIN + i * cols + 4, y + 15);
    });
    y += 26;

    // ── Metric regressions table ──────────────────────────────────────────────
    if (regressions.length > 0) {
      setFont(10, 'bold', [15, 23, 42]);
      doc.text('Metric Regressions', MARGIN, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Page', 'Metric', 'Device', 'Baseline', 'Current', 'Delta']],
        body: regressions.slice(0, 15).map(r => [
          r.pageKey,
          r.metricName,
          r.device === 'mobile' ? 'Mobile' : 'Desktop',
          formatMetricValue(r.baselineValue, r.metricName),
          formatMetricValue(r.currentValue, r.metricName),
          `+${formatMetricValue(r.deltaValue, r.metricName)}`
        ]),
        headStyles: { fillColor: [185, 28, 28], fontSize: 8, fontStyle: 'bold', textColor: [255, 255, 255] },
        bodyStyles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: { 0: { fontStyle: 'bold' }, 5: { fontStyle: 'bold', textColor: [185, 28, 28] } },
        alternateRowStyles: { fillColor: [254, 242, 242] }
      });
      y = (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 10;
    }

    // ── Metric improvements table ─────────────────────────────────────────────
    if (improvements.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      setFont(10, 'bold', [15, 23, 42]);
      doc.text('Metric Improvements', MARGIN, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Page', 'Metric', 'Device', 'Baseline', 'Current', 'Delta']],
        body: improvements.slice(0, 15).map(r => [
          r.pageKey,
          r.metricName,
          r.device === 'mobile' ? 'Mobile' : 'Desktop',
          formatMetricValue(r.baselineValue, r.metricName),
          formatMetricValue(r.currentValue, r.metricName),
          `-${formatMetricValue(r.deltaValue, r.metricName)}`
        ]),
        headStyles: { fillColor: [21, 128, 61], fontSize: 8, fontStyle: 'bold', textColor: [255, 255, 255] },
        bodyStyles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: { 0: { fontStyle: 'bold' }, 5: { fontStyle: 'bold', textColor: [21, 128, 61] } },
        alternateRowStyles: { fillColor: [240, 253, 244] }
      });
      y = (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 10;
    }

    // ── Category score changes ─────────────────────────────────────────────────
    if (comparison.categoryScoreDeltas.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      setFont(10, 'bold', [15, 23, 42]);
      doc.text('Category Score Shifts', MARGIN, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Page', 'Category', 'Device', 'Baseline', 'Current', 'Delta', 'Direction']],
        body: [...categoryRegressions, ...categoryImprovements].slice(0, 20).map(c => [
          c.pageKey,
          c.category.replace(/-/g, ' '),
          c.device === 'mobile' ? 'Mobile' : 'Desktop',
          String(c.baselineScore),
          String(c.currentScore),
          `${c.delta > 0 ? '+' : ''}${c.delta}`,
          c.deltaDirection === 'improved' ? 'Improved' : 'Regressed'
        ]),
        headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: { 0: { fontStyle: 'bold' } },
        didParseCell: (data) => {
          if (data.section !== 'body' || data.column.index !== 6) return;
          const val = String(data.cell.raw);
          if (val === 'Improved') {
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'Regressed') {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.line(MARGIN, 287, W - MARGIN, 287);
      setFont(7, 'normal', [148, 163, 184]);
      doc.text(`Baseline: ${comparison.baselineRun.runId.substring(0,8)}  |  Current: ${comparison.currentRun.runId.substring(0,8)}`, MARGIN, 292);
      doc.text('PERFORMANCE PILOT', W / 2, 292, { align: 'center' });
      doc.text(`Page ${i} of ${total}`, W - MARGIN, 292, { align: 'right' });
    }

    doc.save(`comparison-${comparison.currentRun.projectName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/results">
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Compare Runs</h1>
                <p className="text-xs text-slate-500">{comparison.baselineRun.projectName}</p>
              </div>
            </div>
            <Button onClick={handleDownloadComparisonPDF} className="bg-slate-900 hover:bg-slate-800 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export Comparison PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Run info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Baseline</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="font-bold text-slate-900">{comparison.baselineRun.auditLabel}</p>
              <p className="text-sm text-slate-500">{comparison.baselineRun.projectName}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(comparison.baselineRun.generatedAt)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold tracking-widest text-blue-500 uppercase">Current</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="font-bold text-slate-900">{comparison.currentRun.auditLabel}</p>
              <p className="text-sm text-slate-500">{comparison.currentRun.projectName}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(comparison.currentRun.generatedAt)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {/* Health delta */}
          <Card className={cn(
            "md:col-span-1 border-2",
            healthDelta > 0 ? "border-green-200 bg-green-50" :
            healthDelta < 0 ? "border-red-200 bg-red-50" : "border-slate-200"
          )}>
            <CardContent className="pt-4 pb-4">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">Health</p>
              <p className={cn(
                "text-3xl font-black",
                healthDelta > 0 ? "text-green-600" : healthDelta < 0 ? "text-red-600" : "text-slate-600"
              )}>
                {healthDelta > 0 ? '+' : ''}{healthDelta}%
              </p>
              <p className="text-[10px] text-slate-400 mt-1">{baselineHealth}% → {currentHealth}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">Compared</p>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-slate-400" />
                <p className="text-3xl font-black text-slate-900">{summary.totalCompared}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-[10px] font-bold tracking-widest uppercase text-green-600 mb-1">Improved</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <p className="text-3xl font-black text-green-600">{summary.improved}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-[10px] font-bold tracking-widest uppercase text-red-600 mb-1">Regressed</p>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <p className="text-3xl font-black text-red-600">{summary.regressed}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">Unchanged</p>
              <div className="flex items-center gap-2">
                <Minus className="h-5 w-5 text-slate-400" />
                <p className="text-3xl font-black text-slate-600">{summary.unchanged}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category score summary */}
        {summary.categoryScoresCompared > 0 && (
          <Card className="mb-8 border-indigo-200 bg-indigo-50/40">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-indigo-900 tracking-wide">Lighthouse Category Score Changes</h3>
                <span className="text-xs text-indigo-500 ml-auto">{summary.categoryScoresCompared} scores compared</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Improved', value: summary.categoryScoresImproved, color: 'text-green-600 bg-green-50 border-green-200' },
                  { label: 'Regressed', value: summary.categoryScoresRegressed, color: 'text-red-600 bg-red-50 border-red-200' },
                  { label: 'Unchanged', value: summary.categoryScoresUnchanged, color: 'text-slate-600 bg-white border-slate-200' },
                ].map(item => (
                  <div key={item.label} className={cn("flex items-center justify-between p-3 rounded-lg border", item.color)}>
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-xl font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Page mismatch alerts */}
        {(comparison.missingPages.length > 0 || comparison.newPages.length > 0) && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  {comparison.missingPages.length > 0 && (
                    <p className="text-amber-800 font-medium mb-1">
                      Pages in baseline not in current: <span className="font-normal">{comparison.missingPages.join(', ')}</span>
                    </p>
                  )}
                  {comparison.newPages.length > 0 && (
                    <p className="text-amber-800 font-medium">
                      New pages in current audit: <span className="font-normal">{comparison.newPages.join(', ')}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed comparison tabs */}
        <Tabs defaultValue="metrics">
          <TabsList className="mb-6 bg-slate-100 p-1 rounded-lg h-auto">
            <TabsTrigger value="metrics" className="rounded-md text-sm font-semibold px-4 py-2">
              <Activity className="h-4 w-4 mr-2" />
              Metrics ({comparison.deltas.length})
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-md text-sm font-semibold px-4 py-2">
              <BarChart3 className="h-4 w-4 mr-2" />
              Category Scores ({comparison.categoryScoreDeltas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <Tabs defaultValue="regressions">
              <TabsList className="mb-4">
                <TabsTrigger value="regressions" className="text-red-600 data-[state=active]:bg-red-50">
                  Regressions ({regressions.length})
                </TabsTrigger>
                <TabsTrigger value="improvements" className="text-green-600 data-[state=active]:bg-green-50">
                  Improvements ({improvements.length})
                </TabsTrigger>
                <TabsTrigger value="all">All ({comparison.deltas.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="regressions">
                <ComparisonTable deltas={regressions} />
              </TabsContent>
              <TabsContent value="improvements">
                <ComparisonTable deltas={improvements} />
              </TabsContent>
              <TabsContent value="all">
                <ComparisonTable deltas={comparison.deltas} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="categories">
            <Tabs defaultValue="regressions">
              <TabsList className="mb-4">
                <TabsTrigger value="regressions" className="text-red-600 data-[state=active]:bg-red-50">
                  Regressions ({categoryRegressions.length})
                </TabsTrigger>
                <TabsTrigger value="improvements" className="text-green-600 data-[state=active]:bg-green-50">
                  Improvements ({categoryImprovements.length})
                </TabsTrigger>
                <TabsTrigger value="all">All ({comparison.categoryScoreDeltas.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="regressions">
                <CategoryComparisonTable deltas={categoryRegressions} />
              </TabsContent>
              <TabsContent value="improvements">
                <CategoryComparisonTable deltas={categoryImprovements} />
              </TabsContent>
              <TabsContent value="all">
                <CategoryComparisonTable deltas={comparison.categoryScoreDeltas} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ComparisonTable({ deltas }: { deltas: ComparisonDelta[] }) {
  if (deltas.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No changes in this category</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm border-slate-200 overflow-hidden">
      <CardContent className="p-0">
        <ScrollArea className="h-[480px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest pl-6">Page</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">Metric</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">Device</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Baseline</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Current</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Delta</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest pr-6">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deltas.map((delta, index) => (
                <TableRow key={index} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/20">
                  <TableCell className="font-semibold text-slate-900 pl-6">{delta.pageKey}</TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-700">{delta.metricName}</TableCell>
                  <TableCell className="capitalize text-slate-500 text-sm">{delta.device}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-slate-500">{formatMetricValue(delta.baselineValue, delta.metricName)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold text-slate-900">{formatMetricValue(delta.currentValue, delta.metricName)}</TableCell>
                  <TableCell className={cn(
                    "text-right font-mono text-sm font-bold",
                    delta.deltaDirection === 'improved' ? 'text-green-600' :
                    delta.deltaDirection === 'regressed' ? 'text-red-600' : 'text-slate-400'
                  )}>
                    {delta.deltaDirection === 'improved' ? '−' : delta.deltaDirection === 'regressed' ? '+' : '±'}
                    {formatMetricValue(delta.deltaValue, delta.metricName)}
                  </TableCell>
                  <TableCell className="pr-6">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[9px] uppercase tracking-wider font-black rounded px-2 py-0.5",
                        delta.deltaDirection === 'improved' ? 'bg-green-50 text-green-700 border-green-100' :
                        delta.deltaDirection === 'regressed' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-slate-100 text-slate-500'
                      )}
                    >
                      {delta.deltaDirection === 'improved' && <TrendingUp className="h-2.5 w-2.5 mr-1 inline" />}
                      {delta.deltaDirection === 'regressed' && <TrendingDown className="h-2.5 w-2.5 mr-1 inline" />}
                      {delta.deltaDirection === 'unchanged' && <Minus className="h-2.5 w-2.5 mr-1 inline" />}
                      {delta.deltaDirection}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function CategoryComparisonTable({ deltas }: { deltas: CategoryScoreDelta[] }) {
  if (deltas.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No category score changes</p>
        </CardContent>
      </Card>
    );
  }

  const getCategoryIcon = (category: CategoryName) => {
    switch (category) {
      case 'performance': return <Zap className="h-3.5 w-3.5 text-blue-500" />;
      case 'accessibility': return <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />;
      case 'best-practices': return <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />;
      case 'seo': return <Search className="h-3.5 w-3.5 text-amber-500" />;
      default: return null;
    }
  };

  return (
    <Card className="rounded-xl shadow-sm border-slate-200 overflow-hidden">
      <CardContent className="p-0">
        <ScrollArea className="h-[480px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest pl-6">Page</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">Category</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">Device</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Baseline</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Current</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Delta</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-widest pr-6">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deltas.map((delta, index) => (
                <TableRow key={index} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/20">
                  <TableCell className="font-semibold text-slate-900 pl-6">{delta.pageKey}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {getCategoryIcon(delta.category)}
                      <span className="capitalize text-sm text-slate-700">{delta.category.replace(/-/g, ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-slate-500 text-sm">{delta.device}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-slate-500">{delta.baselineScore}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold text-slate-900">{delta.currentScore}</TableCell>
                  <TableCell className={cn(
                    "text-right font-mono text-sm font-bold",
                    delta.deltaDirection === 'improved' ? 'text-green-600' :
                    delta.deltaDirection === 'regressed' ? 'text-red-600' : 'text-slate-400'
                  )}>
                    {delta.delta > 0 ? '+' : ''}{delta.delta}
                  </TableCell>
                  <TableCell className="pr-6">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[9px] uppercase tracking-wider font-black rounded px-2 py-0.5",
                        delta.deltaDirection === 'improved' ? 'bg-green-50 text-green-700 border-green-100' :
                        delta.deltaDirection === 'regressed' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-slate-100 text-slate-500'
                      )}
                    >
                      {delta.deltaDirection === 'improved' && <TrendingUp className="h-2.5 w-2.5 mr-1 inline" />}
                      {delta.deltaDirection === 'regressed' && <TrendingDown className="h-2.5 w-2.5 mr-1 inline" />}
                      {delta.deltaDirection === 'unchanged' && <Minus className="h-2.5 w-2.5 mr-1 inline" />}
                      {delta.deltaDirection}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
