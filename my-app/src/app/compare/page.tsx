'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { ReportPackage, ComparisonResult, ComparisonDelta, CategoryScoreDelta, CategoryName, Device } from '@/types';
import {
  compareReports,
  generateComparisonSummary,
  getSignificantChanges,
  getSignificantCategoryChanges
} from '@/services/comparison';
import { getBaselineReportAsync, getAuditStateAsync } from '@/services/storage';
import { formatMetricValue, formatDate, calculateOverallHealth, cn } from '@/lib/utils';
import {
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
  Smartphone,
  Monitor,
  ChevronDown,
  FileText
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
  const [selectedDevice, setSelectedDevice] = useState<Device>('mobile');
  const [selectedPage, setSelectedPage] = useState<string>('all');

  useEffect(() => {
    getBaselineReportAsync().then(storedBaseline => {
      if (storedBaseline) setBaseline(storedBaseline);
    });

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

  // Unique page labels from comparison
  const pageLabels = useMemo(() => {
    if (!comparison) return [];
    const labels = new Set(comparison.deltas.map(d => d.pageKey));
    return Array.from(labels);
  }, [comparison]);

  // Filter comparison data by selected device and page
  const filteredComparison = useMemo(() => {
    if (!comparison) return null;
    return {
      ...comparison,
      deltas: comparison.deltas.filter(d =>
        d.device === selectedDevice && (selectedPage === 'all' || d.pageKey === selectedPage)
      ),
      categoryScoreDeltas: comparison.categoryScoreDeltas.filter(d =>
        d.device === selectedDevice && (selectedPage === 'all' || d.pageKey === selectedPage)
      ),
    };
  }, [comparison, selectedDevice, selectedPage]);

  // Get page IDs matching selected page filter
  const selectedPageIds = useMemo(() => {
    if (!baseline || !current || selectedPage === 'all') return null;
    const baselinePageIds = baseline.pages.filter(p => p.pageLabel === selectedPage).map(p => p.pageId);
    const currentPageIds = current.pages.filter(p => p.pageLabel === selectedPage).map(p => p.pageId);
    return { baseline: baselinePageIds, current: currentPageIds };
  }, [selectedPage, baseline, current]);

  if (!baseline || !current) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-foreground font-medium mb-2">
            {!baseline ? 'No baseline report loaded' : 'No current audit found'}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
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

  if (!comparison || !filteredComparison) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Comparing reports...</p>
        </div>
      </div>
    );
  }

  const summary = generateComparisonSummary(filteredComparison);
  const regressions = getSignificantChanges(filteredComparison, 'regressed');
  const improvements = getSignificantChanges(filteredComparison, 'improved');
  const categoryRegressions = getSignificantCategoryChanges(filteredComparison, 'regressed');
  const categoryImprovements = getSignificantCategoryChanges(filteredComparison, 'improved');

  const baselineHealth = calculateOverallHealth(
    baseline.metrics.filter(m => m.device === selectedDevice && (!selectedPageIds || selectedPageIds.baseline.includes(m.pageId)))
  );
  const currentHealth = calculateOverallHealth(
    current.metrics.filter(m => m.device === selectedDevice && (!selectedPageIds || selectedPageIds.current.includes(m.pageId)))
  );
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

    // ── Per-device sections (Mobile then Desktop) ──────────────────────────────
    const devices: Device[] = ['mobile', 'desktop'];
    for (const device of devices) {
      const devDeltas = comparison.deltas.filter(d => d.device === device);
      const devCatDeltas = comparison.categoryScoreDeltas.filter(d => d.device === device);
      const devSummary = generateComparisonSummary({ ...comparison, deltas: devDeltas, categoryScoreDeltas: devCatDeltas });
      const devRegressions = devDeltas.filter(d => d.deltaDirection === 'regressed').sort((a, b) => b.deltaValue - a.deltaValue);
      const devImprovements = devDeltas.filter(d => d.deltaDirection === 'improved').sort((a, b) => b.deltaValue - a.deltaValue);
      const devBaselineHealth = calculateOverallHealth(baseline.metrics.filter(m => m.device === device));
      const devCurrentHealth = calculateOverallHealth(current.metrics.filter(m => m.device === device));
      const devHealthDelta = devCurrentHealth - devBaselineHealth;

      // Device section header
      filledRect(MARGIN, y, CONTENT_W, 10, 30, 41, 59);
      setFont(9, 'bold', [255, 255, 255]);
      doc.text(`${device.toUpperCase()} RESULTS`, MARGIN + 4, y + 7);
      const devHealthColor: [number, number, number] = devHealthDelta > 0 ? [74, 222, 128] : devHealthDelta < 0 ? [248, 113, 113] : [200, 200, 200];
      setFont(8, 'bold', devHealthColor);
      doc.text(`Health: ${devCurrentHealth}% (${devHealthDelta > 0 ? '+' : ''}${devHealthDelta}%)`, CONTENT_W - 10, y + 7, { align: 'right' });
      y += 16;

      // Summary stats row
      const cols = CONTENT_W / 4;
      const statItems = [
        { label: 'Compared', value: String(devSummary.totalCompared), color: [30, 41, 59] as [number,number,number] },
        { label: 'Improved', value: String(devSummary.improved), color: [21, 128, 61] as [number,number,number] },
        { label: 'Regressed', value: String(devSummary.regressed), color: [185, 28, 28] as [number,number,number] },
        { label: 'Unchanged', value: String(devSummary.unchanged), color: [71, 85, 105] as [number,number,number] },
      ];
      statItems.forEach((s, i) => {
        const boxX = MARGIN + i * cols;
        const boxW = cols - 3;
        const centerX = boxX + boxW / 2;
        filledRect(boxX, y, boxW, 16, 248, 250, 252);
        setFont(7, 'bold', [100, 116, 139]);
        doc.text(s.label.toUpperCase(), centerX, y + 5, { align: 'center' });
        setFont(12, 'bold', s.color);
        doc.text(s.value, centerX, y + 13, { align: 'center' });
      });
      y += 22;

      // All metrics table
      if (devDeltas.length > 0) {
        setFont(9, 'bold', [15, 23, 42]);
        doc.text('All Metrics', MARGIN, y);
        y += 4;
        autoTable(doc, {
          startY: y,
          margin: { left: MARGIN, right: MARGIN },
          head: [['Page', 'Metric', 'Baseline', 'Current', 'Delta', 'Trend']],
          body: devDeltas.map(r => [
            r.pageKey,
            r.metricName,
            formatMetricValue(r.baselineValue, r.metricName),
            formatMetricValue(r.currentValue, r.metricName),
            `${r.deltaDirection === 'improved' ? '−' : r.deltaDirection === 'regressed' ? '+' : '±'}${formatMetricValue(r.deltaValue, r.metricName)}`,
            r.deltaDirection.charAt(0).toUpperCase() + r.deltaDirection.slice(1)
          ]),
          headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold', halign: 'center', valign: 'middle' },
          bodyStyles: { fontSize: 8, cellPadding: 3, valign: 'middle', lineWidth: 0.2, lineColor: [226, 232, 240] },
          columnStyles: {
            0: { fontStyle: 'bold', halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' }
          },
          tableLineWidth: 0.2,
          tableLineColor: [226, 232, 240],
          didParseCell: (data) => {
            if (data.section !== 'body' || data.column.index !== 5) return;
            const val = String(data.cell.raw);
            if (val === 'Improved') {
              data.cell.styles.textColor = [21, 128, 61];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'Regressed') {
              data.cell.styles.textColor = [185, 28, 28];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [100, 116, 139];
            }
          },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });
        y = (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 8;
      }

      // Category scores table
      if (devCatDeltas.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        setFont(9, 'bold', [15, 23, 42]);
        doc.text('Category Scores', MARGIN, y);
        y += 4;
        autoTable(doc, {
          startY: y,
          margin: { left: MARGIN, right: MARGIN },
          head: [['Page', 'Category', 'Baseline', 'Current', 'Delta', 'Trend']],
          body: devCatDeltas.map(c => [
            c.pageKey,
            c.category.replace(/-/g, ' '),
            String(c.baselineScore),
            String(c.currentScore),
            `${c.deltaDirection === 'improved' ? '+' : c.deltaDirection === 'regressed' ? '' : '±'}${c.delta}`,
            c.deltaDirection.charAt(0).toUpperCase() + c.deltaDirection.slice(1)
          ]),
          headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold', halign: 'center', valign: 'middle' },
          bodyStyles: { fontSize: 8, cellPadding: 3, valign: 'middle', lineWidth: 0.2, lineColor: [226, 232, 240] },
          columnStyles: {
            0: { fontStyle: 'bold', halign: 'left' },
            1: { halign: 'left' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' }
          },
          tableLineWidth: 0.2,
          tableLineColor: [226, 232, 240],
          didParseCell: (data) => {
            if (data.section !== 'body' || data.column.index !== 5) return;
            const val = String(data.cell.raw);
            if (val === 'Improved') {
              data.cell.styles.textColor = [21, 128, 61];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'Regressed') {
              data.cell.styles.textColor = [185, 28, 28];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [100, 116, 139];
            }
          },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });
        y = (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 8;
      }

      // Page break between mobile and desktop
      if (device === 'mobile') { doc.addPage(); y = 20; }
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
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <main className="max-w-[1100px] mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link href="/results">
              <button className="p-1.5 rounded-lg border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="m15 18-6-6 6-6"/></svg>
              </button>
            </Link>
            <div>
              <h1 className="text-[26px] font-bold text-foreground tracking-[-0.03em]">Audit Comparison</h1>
              <p className="text-muted-foreground text-[15px] mt-0.5">Side-by-side performance delta analysis</p>
            </div>
          </div>
          <button
            onClick={handleDownloadComparisonPDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-[10px] hover:opacity-85 transition-all cursor-pointer border-none"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
        </div>

        {/* Run Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r" style={{ background: 'var(--ring)' }} />
            <div className="pl-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Baseline</span>
              <h3 className="text-base font-bold text-foreground mt-1">{comparison.baselineRun.auditLabel}</h3>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>{formatDate(comparison.baselineRun.generatedAt)}</span>
                <span>{comparison.baselineRun.projectName}</span>
                <span className="status-badge text-muted-foreground" style={{ background: 'var(--background)', padding: '1px 6px', fontSize: '10px' }}>{comparison.baselineRun.environment}</span>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-5 relative overflow-hidden" style={{ border: '1px solid color-mix(in srgb, var(--blue-text) 20%, var(--border))' }}>
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r opacity-60" style={{ background: 'var(--blue-text)' }} />
            <div className="pl-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--blue-text)' }}>Current</span>
              <h3 className="text-base font-bold text-foreground mt-1">{comparison.currentRun.auditLabel}</h3>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>{formatDate(comparison.currentRun.generatedAt)}</span>
                <span>{comparison.currentRun.projectName}</span>
                <span className="status-badge" style={{ background: 'var(--blue-bg)', color: 'var(--blue-text)', padding: '1px 6px', fontSize: '10px' }}>{comparison.currentRun.environment}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delta Summary — Double Bezel */}
        <div className="grid grid-cols-5 gap-3 mb-10">
          <div className="double-bezel">
            <div className="double-bezel-inner text-center !py-3 !px-4">
              <div className="font-mono text-[22px] font-bold" style={{ color: healthDelta > 0 ? 'var(--green-text)' : healthDelta < 0 ? 'var(--red-text)' : 'var(--foreground)' }}>
                {healthDelta > 0 ? '+' : ''}{healthDelta}%
              </div>
              <div className="text-[10px] uppercase tracking-[0.08em] mt-1" style={{ color: 'var(--ring)' }}>Health Delta</div>
            </div>
          </div>
          <div className="double-bezel">
            <div className="double-bezel-inner text-center !py-3 !px-4">
              <div className="font-mono text-[22px] font-bold text-foreground">{summary.totalCompared}</div>
              <div className="text-[10px] uppercase tracking-[0.08em] mt-1" style={{ color: 'var(--ring)' }}>Compared</div>
            </div>
          </div>
          <div className="double-bezel">
            <div className="double-bezel-inner text-center !py-3 !px-4">
              <div className="flex items-center justify-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth={2}><polyline points="18 15 12 9 6 15"/></svg>
                <span className="font-mono text-[22px] font-bold" style={{ color: 'var(--green-text)' }}>{summary.improved}</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.08em] mt-1" style={{ color: 'var(--ring)' }}>Improved</div>
            </div>
          </div>
          <div className="double-bezel">
            <div className="double-bezel-inner text-center !py-3 !px-4">
              <div className="flex items-center justify-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red-text)" strokeWidth={2}><polyline points="6 9 12 15 18 9"/></svg>
                <span className="font-mono text-[22px] font-bold" style={{ color: 'var(--red-text)' }}>{summary.regressed}</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.08em] mt-1" style={{ color: 'var(--ring)' }}>Regressed</div>
            </div>
          </div>
          <div className="double-bezel">
            <div className="double-bezel-inner text-center !py-3 !px-4">
              <div className="flex items-center justify-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth={2}><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span className="font-mono text-[22px] font-bold text-muted-foreground">{summary.unchanged}</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.08em] mt-1" style={{ color: 'var(--ring)' }}>Unchanged</div>
            </div>
          </div>
        </div>

        {/* Category score summary */}
        {summary.categoryScoresCompared > 0 && (
          <div className="mb-8 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4" style={{ color: 'var(--blue-text)' }} />
              <h3 className="text-sm font-bold text-foreground tracking-wide">Lighthouse Category Score Changes</h3>
              <span className="text-xs text-muted-foreground ml-auto">{summary.categoryScoresCompared} scores compared</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Improved', value: summary.categoryScoresImproved, bgVar: 'var(--green-bg)', textVar: 'var(--green-text)' },
                { label: 'Regressed', value: summary.categoryScoresRegressed, bgVar: 'var(--red-bg)', textVar: 'var(--red-text)' },
                { label: 'Unchanged', value: summary.categoryScoresUnchanged, bgVar: 'var(--background)', textVar: 'var(--muted-foreground)' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: item.bgVar, color: item.textVar }}>
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xl font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page mismatch alerts */}
        {(comparison.missingPages.length > 0 || comparison.newPages.length > 0) && (
          <div className="mb-6 p-4 rounded-xl border flex items-start gap-3" style={{ background: 'var(--amber-bg)', borderColor: 'color-mix(in srgb, var(--amber-text) 15%, transparent)' }}>
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--amber-text)' }} />
            <div className="text-sm" style={{ color: 'var(--amber-text)' }}>
              {comparison.missingPages.length > 0 && (
                <p className="font-medium mb-1">
                  Pages in baseline not in current: <span className="font-normal">{comparison.missingPages.join(', ')}</span>
                </p>
              )}
              {comparison.newPages.length > 0 && (
                <p className="font-medium">
                  New pages in current audit: <span className="font-normal">{comparison.newPages.join(', ')}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Detailed Comparison */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <Tabs defaultValue="metrics" className="w-full">
            {/* Row 1: Primary tabs (left) + Page dropdown + Device toggle (right) */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0 gap-3">
              <TabsList className="bg-secondary p-1 rounded-lg h-auto w-fit shrink-0">
                <TabsTrigger value="metrics" className="rounded-md text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Activity className="h-3.5 w-3.5 mr-2" />
                  Metrics ({filteredComparison.deltas.length})
                </TabsTrigger>
                <TabsTrigger value="categories" className="rounded-md text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <BarChart3 className="h-3.5 w-3.5 mr-2" />
                  Category Scores ({filteredComparison.categoryScoreDeltas.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                {/* Page filter dropdown */}
                {pageLabels.length >= 1 && (
                  <div className="relative">
                    <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <select
                      value={selectedPage}
                      onChange={(e) => setSelectedPage(e.target.value)}
                      className="appearance-none bg-secondary border border-border rounded-lg pl-8 pr-8 py-1.5 text-[11px] font-bold uppercase tracking-widest text-foreground cursor-pointer hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {pageLabels.length > 1 && (
                        <option value="all">All Pages ({pageLabels.length})</option>
                      )}
                      {pageLabels.map(label => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                )}

                {/* Device toggle */}
                <div className="flex items-center gap-2 bg-secondary p-1 rounded-lg border border-border">
                  <button
                    onClick={() => setSelectedDevice('mobile')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all",
                      selectedDevice === 'mobile'
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile
                  </button>
                  <button
                    onClick={() => setSelectedDevice('desktop')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all",
                      selectedDevice === 'desktop'
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Desktop
                  </button>
                </div>
              </div>
            </div>

            <TabsContent value="metrics" className="mt-0">
              <Tabs defaultValue="all">
                {/* Row 2: Info text (left) + Filter pills (right) */}
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Showing {selectedDevice} results · {summary.totalCompared} metrics compared
                  </span>
                  <TabsList className="bg-transparent p-0 h-auto gap-1">
                    <TabsTrigger
                      value="all"
                      className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide border border-transparent data-[state=active]:border-border data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground"
                    >
                      All ({filteredComparison.deltas.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="regressions"
                      className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide border border-transparent data-[state=active]:border-red-500/20 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500 text-muted-foreground"
                    >
                      Regressions ({regressions.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="improvements"
                      className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide border border-transparent data-[state=active]:border-green-500/20 data-[state=active]:bg-green-500/10 data-[state=active]:text-green-500 text-muted-foreground"
                    >
                      Improvements ({improvements.length})
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="all" className="mt-0">
                  <ComparisonTable deltas={filteredComparison.deltas} />
                </TabsContent>
                <TabsContent value="regressions" className="mt-0">
                  <ComparisonTable deltas={regressions} />
                </TabsContent>
                <TabsContent value="improvements" className="mt-0">
                  <ComparisonTable deltas={improvements} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="categories" className="mt-0">
              <Tabs defaultValue="all">
                {/* Row 2: Info text (left) + Filter pills (right) */}
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Showing {selectedDevice} results · {filteredComparison.categoryScoreDeltas.length} scores compared
                  </span>
                  <TabsList className="bg-transparent p-0 h-auto gap-1">
                    <TabsTrigger
                      value="all"
                      className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide border border-transparent data-[state=active]:border-border data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground"
                    >
                      All ({filteredComparison.categoryScoreDeltas.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="regressions"
                      className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide border border-transparent data-[state=active]:border-red-500/20 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500 text-muted-foreground"
                    >
                      Regressions ({categoryRegressions.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="improvements"
                      className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide border border-transparent data-[state=active]:border-green-500/20 data-[state=active]:bg-green-500/10 data-[state=active]:text-green-500 text-muted-foreground"
                    >
                      Improvements ({categoryImprovements.length})
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="all" className="mt-0">
                  <CategoryComparisonTable deltas={filteredComparison.categoryScoreDeltas} />
                </TabsContent>
                <TabsContent value="regressions" className="mt-0">
                  <CategoryComparisonTable deltas={categoryRegressions} />
                </TabsContent>
                <TabsContent value="improvements" className="mt-0">
                  <CategoryComparisonTable deltas={categoryImprovements} />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function ComparisonTable({ deltas }: { deltas: ComparisonDelta[] }) {
  if (deltas.length === 0) {
    return (
      <div className="py-16 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500/50 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium text-sm">No changes in this category</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-t border-border">
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest pl-6">Page</TableHead>
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Metric</TableHead>
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest text-center">Baseline</TableHead>
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest text-center w-8"></TableHead>
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest text-center">Current</TableHead>
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest text-right">Delta</TableHead>
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest text-right pr-6">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deltas.map((delta, index) => (
            <TableRow key={index} className={cn(
              "border-b border-border last:border-0 hover:bg-secondary/40 transition-colors",
              index % 2 === 0 ? "" : "bg-secondary/20"
            )}>
              <TableCell className="font-semibold text-foreground pl-6 text-sm">{delta.pageKey}</TableCell>
              <TableCell>
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-secondary border border-border text-foreground">
                  {delta.metricName}
                </span>
              </TableCell>
              <TableCell className="text-center font-mono text-sm text-muted-foreground tabular-nums">
                {formatMetricValue(delta.baselineValue, delta.metricName)}
              </TableCell>
              <TableCell className="text-center text-muted-foreground/40">→</TableCell>
              <TableCell className="text-center font-mono text-sm font-bold text-foreground tabular-nums">
                {formatMetricValue(delta.currentValue, delta.metricName)}
              </TableCell>
              <TableCell className={cn(
                "text-right font-mono text-sm font-bold tabular-nums",
                delta.deltaDirection === 'improved' ? 'text-green-500' :
                delta.deltaDirection === 'regressed' ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {delta.deltaDirection === 'improved' ? '−' : delta.deltaDirection === 'regressed' ? '+' : '±'}
                {formatMetricValue(delta.deltaValue, delta.metricName)}
              </TableCell>
              <TableCell className="text-right pr-6">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[9px] uppercase tracking-wider font-black rounded-full px-2.5 py-0.5",
                    delta.deltaDirection === 'improved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    delta.deltaDirection === 'regressed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-muted text-muted-foreground'
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
    </div>
  );
}

function CategoryComparisonTable({ deltas }: { deltas: CategoryScoreDelta[] }) {
  if (deltas.length === 0) {
    return (
      <div className="py-16 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500/50 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium text-sm">No category score changes</p>
      </div>
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
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-t border-border">
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest pl-6">Page</TableHead>
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Category</TableHead>
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest text-center">Baseline</TableHead>
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest text-center w-8"></TableHead>
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest text-center">Current</TableHead>
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest text-right">Delta</TableHead>
            <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest text-right pr-6">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deltas.map((delta, index) => (
            <TableRow key={index} className={cn(
              "border-b border-border last:border-0 hover:bg-secondary/40 transition-colors",
              index % 2 === 0 ? "" : "bg-secondary/20"
            )}>
              <TableCell className="font-semibold text-foreground pl-6 text-sm">{delta.pageKey}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getCategoryIcon(delta.category)}
                  <span className="capitalize text-sm text-foreground font-medium">{delta.category.replace(/-/g, ' ')}</span>
                </div>
              </TableCell>
              <TableCell className="text-center font-mono text-sm text-muted-foreground tabular-nums">{delta.baselineScore}</TableCell>
              <TableCell className="text-center text-muted-foreground/40">→</TableCell>
              <TableCell className="text-center font-mono text-sm font-bold text-foreground tabular-nums">{delta.currentScore}</TableCell>
              <TableCell className={cn(
                "text-right font-mono text-sm font-bold tabular-nums",
                delta.deltaDirection === 'improved' ? 'text-green-500' :
                delta.deltaDirection === 'regressed' ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {delta.deltaDirection === 'improved' ? '+' : delta.deltaDirection === 'regressed' ? '' : '±'}{delta.delta}
              </TableCell>
              <TableCell className="text-right pr-6">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[9px] uppercase tracking-wider font-black rounded-full px-2.5 py-0.5",
                    delta.deltaDirection === 'improved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    delta.deltaDirection === 'regressed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-muted text-muted-foreground'
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
    </div>
  );
}
