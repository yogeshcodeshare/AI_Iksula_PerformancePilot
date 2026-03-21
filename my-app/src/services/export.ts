// Export service - PDF and JSON generation
// Uses jspdf-autotable for proper table layouts with color-coded cells
import {
  ReportPackage,
  AuditRun,
  AuditPage,
  MetricResult,
  CategoryScore,
  DiagnosticItem,
  CWVAssessment,
  Device,
  CategoryName,
  Status,
  DiagnosticStatus
} from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatMetricValue, calculateOverallHealth } from '@/lib/utils';
import { THRESHOLDS, APP_VERSION, SCHEMA_VERSION } from '@/lib/constants';

// ─── Status color helpers ─────────────────────────────────────────────────────

/** RGB fill color for status — used in cell backgrounds */
function statusFill(status: Status | string): [number, number, number] {
  if (status === 'good') return [220, 252, 231];         // green-100
  if (status === 'needs-improvement') return [254, 243, 199]; // amber-100
  if (status === 'poor') return [254, 226, 226];         // red-100
  return [241, 245, 249];                                 // slate-100
}

/** RGB text color for status */
function statusText(status: Status | string): [number, number, number] {
  if (status === 'good') return [21, 128, 61];           // green-700
  if (status === 'needs-improvement') return [146, 64, 14]; // amber-800
  if (status === 'poor') return [185, 28, 28];           // red-700
  return [71, 85, 105];                                   // slate-600
}

/** Label for status */
function statusLabel(status: Status | string): string {
  if (status === 'good') return 'Good';
  if (status === 'needs-improvement') return 'Needs Imp.';
  if (status === 'poor') return 'Poor';
  return status ? String(status) : 'N/A';
}

// ─── PUBLIC API ────────────────────────────────────────────────────────────────

export function generateReportPackage(
  run: AuditRun,
  pages: AuditPage[],
  metrics: MetricResult[],
  categoryScores: CategoryScore[] = [],
  diagnostics: DiagnosticItem[] = [],
  cwvAssessments: CWVAssessment[] = []
): ReportPackage {
  return {
    metadata: {
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      generatedAt: new Date().toISOString(),
      thresholdProfile: 'core-web-vitals-default',
      sourcePolicy: 'pagespeed-first-lighthouse-fallback'
    },
    auditRun: run,
    pages: [...pages].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    metrics,
    categoryScores,
    diagnostics,
    cwvAssessments,
    evidence: []
  };
}

export function downloadJSON(reportPackage: ReportPackage): void {
  const blob = new Blob([JSON.stringify(reportPackage, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-${reportPackage.auditRun.projectName.replace(/\s+/g, '-').toLowerCase()}-${reportPackage.auditRun.runId.substring(0, 8)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── PDF GENERATION ────────────────────────────────────────────────────────────

export function generatePDF(reportPackage: ReportPackage, comparisonPkg?: ReportPackage): jsPDF {
  const { auditRun, pages, metrics, categoryScores, diagnostics, cwvAssessments } = reportPackage;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; // page width mm
  const MARGIN = 15;
  const CONTENT_W = W - MARGIN * 2;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const setFont = (size: number, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [30, 41, 59]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
  };

  const filledRect = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) => {
    doc.setFillColor(r, g, b);
    doc.rect(x, y, w, h, 'F');
  };

  const wrappedText = (text: string, x: number, y: number, maxW: number, size = 9, color: [number, number, number] = [71, 85, 105]): number => {
    setFont(size, 'normal', color);
    const lines = doc.splitTextToSize(text, maxW);
    doc.text(lines, x, y);
    return y + lines.length * (size * 0.35 + 1.2);
  };

  const addPageHeader = (title: string) => {
    filledRect(0, 0, W, 12, 15, 23, 42); // Navy top bar
    setFont(8, 'bold', [148, 163, 184]);
    doc.text(`${auditRun.projectName}  |  ${auditRun.auditLabel}`, MARGIN, 8);
    doc.text(title, W - MARGIN, 8, { align: 'right' });
  };

  const pageBreak = (title: string = '') => {
    doc.addPage();
    addPageHeader(title || auditRun.projectName);
  };

  // ── Overall summary stats ──────────────────────────────────────────────────
  const goodCount = metrics.filter(m => m.status === 'good').length;
  const warnCount = metrics.filter(m => m.status === 'needs-improvement').length;
  const poorCount = metrics.filter(m => m.status === 'poor').length;
  const overallHealth = calculateOverallHealth(metrics);
  const fallbackCount = metrics.filter(m => m.fallbackTriggered).length;
  const cwvPassCount = cwvAssessments.filter(a => a.status === 'passed').length;
  const cwvTotal = cwvAssessments.filter(a => a.status !== 'not-available').length;

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER & EXECUTIVE SUMMARY
  // ══════════════════════════════════════════════════════════════════════════════

  // Navy header bar
  filledRect(0, 0, W, 60, 15, 23, 42);

  // Logo Placeholder / Brand Area
  setFont(10, 'bold', [56, 189, 248]);
  doc.text('IKSULA PERFORMANCE PILOT', MARGIN, 15);

  // Title
  setFont(24, 'bold', [255, 255, 255]);
  doc.text('Performance Audit Report', MARGIN, 28);

  // Subtitle
  setFont(12, 'normal', [148, 163, 184]);
  doc.text(auditRun.projectName, MARGIN, 38);
  setFont(10, 'normal', [148, 163, 184]);
  doc.text(`${auditRun.auditLabel}  |  ${auditRun.environment.toUpperCase()}  |  ${formatDate(auditRun.generatedAt)}`, MARGIN, 46);

  // Overall Health Score Box
  filledRect(W - 65, 12, 50, 40, 30, 41, 59); // Dark blue box
  setFont(9, 'bold', [148, 163, 184]);
  doc.text('OVERALL HEALTH', W - 40, 22, { align: 'center' });
  setFont(28, 'bold', overallHealth >= 80 ? [74, 222, 128] : overallHealth >= 50 ? [251, 191, 36] : [248, 113, 113]);
  doc.text(`${overallHealth}%`, W - 40, 38, { align: 'center' });

  let y = 75;
  setFont(16, 'bold', [15, 23, 42]);
  doc.text('Executive Summary', MARGIN, y);
  y += 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, W - MARGIN, y);
  y += 10;

  // Key Stats Grid
  const stats = [
    { label: 'Scope', value: `${pages.length} Pages` },
    { label: 'Metrics', value: String(metrics.length) },
    { label: 'CWV Pass Rate', value: cwvTotal > 0 ? `${Math.round((cwvPassCount/cwvTotal)*100)}%` : 'N/A' },
    { label: 'Data Source', value: fallbackCount > 0 ? 'Hybrid (PSI+LH)' : 'PSI Field Data' }
  ];

  stats.forEach((stat, i) => {
    const colW = CONTENT_W / 4;
    setFont(8, 'bold', [100, 116, 139]);
    doc.text(stat.label.toUpperCase(), MARGIN + i * colW, y);
    setFont(12, 'bold', [15, 23, 42]);
    doc.text(stat.value, MARGIN + i * colW, y + 6);
  });
  y += 18;

  // Summary Text
  setFont(10, 'bold', [15, 23, 42]);
  doc.text('Audit Overview', MARGIN, y);
  y += 6;
  const overviewText = `Overall website performance for ${auditRun.projectName} is rated at ${overallHealth}%. ` +
    `${cwvPassCount} of ${cwvTotal} page-device combinations analyzed meet the Core Web Vitals thresholds. ` +
    `Found ${poorCount} poor metric results that require immediate attention. ` +
    `Testing was conducted on both Mobile and Desktop devices using the Google PageSpeed Insights V5 API.`;
  y = wrappedText(overviewText, MARGIN, y, CONTENT_W, 10, [15, 23, 42]);
  y += 10;

  // Metric status summary
  setFont(10, 'bold', [15, 23, 42]);
  doc.text('Metric Status Distribution', MARGIN, y);
  y += 8;
  
  const statusLabels = ['GOOD (PASS)', 'NEEDS IMPROVEMENT', 'POOR (FAIL)'];
  const statusValues = [goodCount, warnCount, poorCount];
  const statusColors: Array<[number,number,number]> = [[34, 197, 94], [234, 179, 8], [239, 68, 68]];

  statusLabels.forEach((label, i) => {
    const barW = 80;
    const barValW = (statusValues[i] / metrics.length) * barW;
    
    // Background bar
    filledRect(MARGIN + 60, y - 4, barW, 4, 241, 245, 249);
    // Progress bar
    filledRect(MARGIN + 60, y - 4, barValW, 4, ...statusColors[i]);
    
    setFont(8, 'bold', statusColors[i]);
    doc.text(label, MARGIN, y);
    setFont(9, 'bold', [15, 23, 42]);
    doc.text(String(statusValues[i]), MARGIN + 145, y);
    y += 7;
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PAGE 2 — METHODOLOGY & THRESHOLDS
  // ═════════════════════════════════════════════════════════════════════════════

  pageBreak('Methodology & Standards');
  y = 25;
  setFont(14, 'bold', [15, 23, 42]);
  doc.text('Audit Methodology', MARGIN, y);
  y += 6;
  
  const methodologyText = 'This report provides a standardized assessment of website performance based on Google’s Core Web Vitals (CWV) and PageSpeed Insights (PSI). We prioritize Field Data (CrUX) to represent actual user experiences over the last 28 days.';
  y = wrappedText(methodologyText, MARGIN, y, CONTENT_W, 9);
  y += 8;

  setFont(10, 'bold', [15, 23, 42]);
  doc.text('Core Web Vitals Thresholds (Google 2024)', MARGIN, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Metric', 'Description', 'Good (Pass)', 'Poor (Fail)', 'Unit']],
    body: [
      ['LCP', 'Largest Contentful Paint', '≤ 2.5', '> 4.0', 's'],
      ['INP', 'Interaction to Next Paint', '≤ 200', '> 500', 'ms'],
      ['CLS', 'Cumulative Layout Shift', '≤ 0.10', '> 0.25', '-'],
      ['FCP', 'First Contentful Paint', '≤ 1.8', '> 3.0', 's'],
      ['TTFB', 'Time to First Byte', '≤ 0.8', '> 1.8', 's'],
    ],
    headStyles: { fillColor: [15, 23, 42], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold' }, 2: { textColor: [21, 128, 61] }, 3: { textColor: [185, 28, 28] } },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // ═════════════════════════════════════════════════════════════════════════════
  // PAGE 3 — AUDIT SCOPE (URL INVENTORY)
  // ═════════════════════════════════════════════════════════════════════════════

  pageBreak('Audit Scope & Inventory');
  y = 25;
  setFont(14, 'bold', [15, 23, 42]);
  doc.text('Audited URLs', MARGIN, y);
  y += 5;

  autoTable(doc, {
    startY: y + 2,
    margin: { left: MARGIN, right: MARGIN },
    head: [['#', 'Label', 'Type', 'URL']],
    body: pages.map((p, i) => [String(i + 1), p.pageLabel, p.pageType, p.url]),
    headStyles: { fillColor: [15, 23, 42], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 40, fontStyle: 'bold' },
      2: { cellWidth: 30 },
      3: { cellWidth: 'auto', overflow: 'ellipsize' }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PAGE 3b — CORE WEB VITALS ASSESSMENT SUMMARY
  // ═════════════════════════════════════════════════════════════════════════════

  if (cwvAssessments.length > 0) {
    pageBreak('Core Web Vitals Assessment');
    y = 25;
    setFont(14, 'bold', [15, 23, 42]);
    doc.text('Core Web Vitals Assessment', MARGIN, y);
    y += 4;
    setFont(9, 'normal', [71, 85, 105]);
    doc.text('LCP, INP, and CLS thresholds per Google CWV program. A page passes if ALL three are Good.', MARGIN, y);
    y += 8;

    const cwvHead = [['Page', 'Device', 'CWV Pass?', 'LCP', 'INP', 'CLS', 'Interpretation']];
    const cwvBody: any[] = [];
    pages.forEach(page => {
      (['mobile', 'desktop'] as Device[]).forEach(device => {
        const cwv = cwvAssessments.find(a => a.pageId === page.pageId && a.device === device);
        if (!cwv) return;
        cwvBody.push([
          page.pageLabel,
          device === 'mobile' ? 'Mobile' : 'Desktop',
          cwv.status === 'passed' ? 'PASS ✓' : cwv.status === 'failed' ? 'FAIL ✗' : 'N/A',
          cwv.lcp ? `${cwv.lcp.displayValue}` : '-',
          cwv.inp ? `${cwv.inp.displayValue}` : '-',
          cwv.cls ? `${cwv.cls.displayValue}` : '-',
          (cwv.interpretation || '').substring(0, 50),
        ]);
      });
    });

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: cwvHead,
      body: cwvBody,
      headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        1: { cellWidth: 16 },
        2: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 2) return;
        const val = String(data.cell.raw);
        if (val.includes('PASS')) {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.textColor = [21, 128, 61];
        } else if (val.includes('FAIL')) {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [185, 28, 28];
        }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // Category scores table
    if (categoryScores.length > 0) {
      if (y > 200) { pageBreak('Category Scores'); y = 25; }
      setFont(12, 'bold', [15, 23, 42]);
      doc.text('Lighthouse Category Scores (0–100)', MARGIN, y);
      y += 4;
      setFont(8, 'normal', [71, 85, 105]);
      doc.text('Scores from Lighthouse lab simulation. Performance ≥90 = Good, ≥50 = Fair, <50 = Poor.', MARGIN, y);
      y += 6;

      const catHead = [['Page', 'Device', 'Performance', 'Accessibility', 'Best Practices', 'SEO']];
      const catBody: any[] = [];
      pages.forEach(page => {
        (['mobile', 'desktop'] as Device[]).forEach(device => {
          const cs = categoryScores.filter(s => s.pageId === page.pageId && s.device === device);
          if (cs.length === 0) return;
          const getScore = (cat: CategoryName) => {
            const s = cs.find(c => c.category === cat);
            return s ? String(s.score) : '-';
          };
          catBody.push([
            page.pageLabel,
            device === 'mobile' ? 'Mobile' : 'Desktop',
            getScore('performance'),
            getScore('accessibility'),
            getScore('best-practices'),
            getScore('seo'),
          ]);
        });
      });

      const scoreColor = (val: string): [number, number, number] | null => {
        const n = parseInt(val);
        if (isNaN(n)) return null;
        if (n >= 90) return [220, 252, 231];
        if (n >= 50) return [254, 243, 199];
        return [254, 226, 226];
      };
      const scoreTextColor = (val: string): [number, number, number] => {
        const n = parseInt(val);
        if (isNaN(n)) return [71, 85, 105];
        if (n >= 90) return [21, 128, 61];
        if (n >= 50) return [146, 64, 14];
        return [185, 28, 28];
      };

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: catHead,
        body: catBody,
        headStyles: { fillColor: [15, 23, 42], fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8.5, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 38 },
          1: { cellWidth: 18 },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
        },
        didParseCell: (data) => {
          if (data.section !== 'body' || data.column.index < 2) return;
          const val = String(data.cell.raw);
          const fill = scoreColor(val);
          if (fill) {
            data.cell.styles.fillColor = fill;
            data.cell.styles.textColor = scoreTextColor(val);
            data.cell.styles.fontStyle = 'bold';
          }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // PAGE 4 — DETAILED MATRIX
  // ═════════════════════════════════════════════════════════════════════════════

  pageBreak('Performance Matrix');
  y = 25;
  setFont(14, 'bold', [15, 23, 42]);
  doc.text('Detailed Results Matrix', MARGIN, y);
  y += 5;

  const matrixHead = [['Page Label', 'Device', 'LCP', 'INP', 'CLS', 'FCP', 'TTFB', 'Score']];
  const matrixBody: any[] = [];
  pages.forEach(page => {
    (['mobile', 'desktop'] as Device[]).forEach(device => {
      const pm = metrics.filter(m => m.pageId === page.pageId && m.device === device);
      const getM = (name: string) => pm.find(m => m.metricName === name);
      matrixBody.push([
        page.pageLabel,
        device === 'mobile' ? 'Mobile' : 'Desktop',
        getM('LCP') ? formatMetricValue(getM('LCP')!.value, 'LCP') : '-',
        getM('INP') ? formatMetricValue(getM('INP')!.value, 'INP') : '-',
        getM('CLS') ? formatMetricValue(getM('CLS')!.value, 'CLS') : '-',
        getM('FCP') ? formatMetricValue(getM('FCP')!.value, 'FCP') : '-',
        getM('TTFB') ? formatMetricValue(getM('TTFB')!.value, 'TTFB') : '-',
        getM('performance_score') ? String(getM('performance_score')!.value) : '-',
      ]);
    });
  });

  autoTable(doc, {
    startY: y + 2,
    margin: { left: MARGIN, right: MARGIN },
    head: matrixHead,
    body: matrixBody,
    headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 18 }
    },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index < 2) return;
      const metricNames: Record<number, string> = { 2: 'LCP', 3: 'INP', 4: 'CLS', 5: 'FCP', 6: 'TTFB', 7: 'performance_score' };
      const mName = metricNames[data.column.index];
      const pageLabel = matrixBody[data.row.index][0];
      const device = matrixBody[data.row.index][1].toLowerCase() as Device;
      const page = pages.find(p => p.pageLabel === pageLabel);
      if (!page) return;
      const mResult = metrics.find(m => m.pageId === page.pageId && m.device === device && m.metricName === mName);
      if (mResult) {
        data.cell.styles.fillColor = statusFill(mResult.status);
        data.cell.styles.textColor = statusText(mResult.status);
      }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PAGE 5 — COMPARISON SUMMARY (if enabled)
  // ═════════════════════════════════════════════════════════════════════════════

  if (comparisonPkg) {
    pageBreak('Audit Comparison');
    y = 25;
    setFont(14, 'bold', [15, 23, 42]);
    doc.text('Comparison to Baseline', MARGIN, y);
    y += 5;
    setFont(9, 'normal', [71, 85, 105]);
    doc.text(`Baseline Project: ${comparisonPkg.auditRun.projectName} (${formatDate(comparisonPkg.auditRun.generatedAt)})`, MARGIN, y);
    y += 10;

    // We calculate a few high level deltas here
    const baselineHealth = calculateOverallHealth(comparisonPkg.metrics);
    const healthDelta = overallHealth - baselineHealth;
    
    filledRect(MARGIN, y, CONTENT_W, 20, 241, 245, 249);
    setFont(10, 'bold', [30, 41, 59]);
    doc.text('Overall Health Change', MARGIN + 5, y + 8);
    setFont(12, 'bold', healthDelta > 0 ? [21, 128, 61] : healthDelta < 0 ? [185, 28, 28] : [71, 85, 105]);
    doc.text(`${healthDelta > 0 ? '+' : ''}${healthDelta}%`, MARGIN + 5, y + 15);
    y += 30;

    // Top improvements/regressions
    setFont(10, 'bold', [15, 23, 42]);
    doc.text('Page Performance Shifts', MARGIN, y);
    y += 6;

    const deltaRows: any[] = [];
    pages.slice(0, 10).forEach(page => {
      (['mobile', 'desktop'] as Device[]).forEach(device => {
        const currentScore = categoryScores.find(s => s.pageId === page.pageId && s.device === device && s.category === 'performance')?.score;
        const baselinePage = comparisonPkg.pages.find(p => p.url === page.url);
        const baselineScore = baselinePage 
            ? comparisonPkg.categoryScores.find(s => s.pageId === baselinePage.pageId && s.device === device && s.category === 'performance')?.score 
            : undefined;

        if (currentScore !== undefined && baselineScore !== undefined) {
          const d = currentScore - baselineScore;
          if (Math.abs(d) >= 1) {
            deltaRows.push([
              page.pageLabel,
              device === 'mobile' ? 'Mobile' : 'Desktop',
              baselineScore,
              currentScore,
              `${d > 0 ? '+' : ''}${d}`,
              d > 0 ? 'Improved' : 'Regressed'
            ]);
          }
        }
      });
    });

    if (deltaRows.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Page', 'Device', 'Baseline', 'Current', 'Delta', 'Status']],
        body: deltaRows,
        headStyles: { fillColor: [71, 85, 105], fontSize: 8.5 },
        bodyStyles: { fontSize: 8.5 },
        columnStyles: { 4: { fontStyle: 'bold' }, 5: { fontStyle: 'bold' } },
        didParseCell: (data) => {
            if (data.section !== 'body' || data.column.index !== 5) return;
            const status = String(data.cell.raw);
            if (status === 'Improved') data.cell.styles.textColor = [21, 128, 61];
            if (status === 'Regressed') data.cell.styles.textColor = [185, 28, 28];
        }
      });
    } else {
        doc.text('No significant performance shifts detected compared to baseline.', MARGIN, y);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // PAGE 5 — TOP ISSUES & CRITICAL FINDINGS
  // ═════════════════════════════════════════════════════════════════════════════

  const criticalDiags = diagnostics
    .filter(d => d.status === 'fail' && d.savings && d.savings > 0)
    .sort((a, b) => (b.savings || 0) - (a.savings || 0))
    .slice(0, 15);

  const poorMetrics = metrics.filter(m => m.status === 'poor');

  if (criticalDiags.length > 0 || poorMetrics.length > 0) {
    pageBreak('Key Findings & Top Issues');
    y = 25;
    setFont(14, 'bold', [15, 23, 42]);
    doc.text('Key Findings & Top Issues', MARGIN, y);
    y += 5;

    // Critical poor metrics summary
    if (poorMetrics.length > 0) {
      filledRect(MARGIN, y, CONTENT_W, 8, 254, 226, 226);
      setFont(9, 'bold', [185, 28, 28]);
      doc.text(`⚠  ${poorMetrics.length} Critical Metric Failure${poorMetrics.length > 1 ? 's' : ''} — Require Immediate Attention`, MARGIN + 4, y + 5.5);
      y += 12;

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Page', 'Device', 'Metric', 'Value', 'Threshold']],
        body: poorMetrics.map(m => {
          const page = pages.find(p => p.pageId === m.pageId);
          return [
            page?.pageLabel || m.pageId,
            m.device === 'mobile' ? 'Mobile' : 'Desktop',
            m.metricName,
            formatMetricValue(m.value, m.metricName),
            `> ${formatMetricValue(m.thresholdWarn, m.metricName)}`,
          ];
        }),
        headStyles: { fillColor: [185, 28, 28], fontSize: 8, fontStyle: 'bold', textColor: [255, 255, 255] },
        bodyStyles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: { 0: { fontStyle: 'bold' }, 3: { fontStyle: 'bold' } },
        didParseCell: (data) => {
          if (data.section === 'body') {
            data.cell.styles.fillColor = [254, 242, 242];
            data.cell.styles.textColor = [127, 29, 29];
          }
        }
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Top optimization opportunities by savings
    if (criticalDiags.length > 0) {
      if (y > 210) { pageBreak('Top Optimization Opportunities'); y = 25; }
      setFont(11, 'bold', [15, 23, 42]);
      doc.text('Top Optimization Opportunities (by Potential Savings)', MARGIN, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Rank', 'Page', 'Device', 'Issue', 'Category', 'Savings']],
        body: criticalDiags.map((d, i) => {
          const page = pages.find(p => p.pageId === d.pageId);
          const savingsStr = d.savings
            ? d.savingsUnit === 'ms'
              ? `${(d.savings / 1000).toFixed(1)} s`
              : `${(d.savings / 1024).toFixed(0)} KB`
            : '-';
          return [
            String(i + 1),
            page?.pageLabel || d.pageId,
            d.device === 'mobile' ? 'Mobile' : 'Desktop',
            d.title,
            d.category,
            savingsStr,
          ];
        }),
        headStyles: { fillColor: [30, 41, 59], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 32, fontStyle: 'bold' },
          2: { cellWidth: 18 },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 25 },
          5: { cellWidth: 22, fontStyle: 'bold', halign: 'right' },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // PER-PAGE DIAGNOSTIC WORKSPACE SECTIONS
  // ═════════════════════════════════════════════════════════════════════════════

  const diagStatusOrder: DiagnosticStatus[] = ['fail', 'warning', 'pass', 'manual', 'not-applicable', 'informative'];
  const diagStatusLabel = (s: DiagnosticStatus): string => {
    if (s === 'fail') return 'FAIL';
    if (s === 'warning') return 'WARN';
    if (s === 'pass') return 'PASS';
    if (s === 'manual') return 'MANUAL';
    return 'N/A';
  };
  const diagStatusFill = (s: DiagnosticStatus): [number, number, number] => {
    if (s === 'fail') return [254, 226, 226];
    if (s === 'warning') return [254, 243, 199];
    if (s === 'pass') return [220, 252, 231];
    if (s === 'manual') return [219, 234, 254];
    return [241, 245, 249];
  };
  const diagStatusTextColor = (s: DiagnosticStatus): [number, number, number] => {
    if (s === 'fail') return [185, 28, 28];
    if (s === 'warning') return [146, 64, 14];
    if (s === 'pass') return [21, 128, 61];
    if (s === 'manual') return [29, 78, 216];
    return [71, 85, 105];
  };

  pages.forEach(page => {
    pageBreak('Page Diagnostic Workspace');

    // Page header banner
    filledRect(MARGIN, 16, CONTENT_W, 16, 15, 23, 42);
    setFont(13, 'bold', [255, 255, 255]);
    doc.text(page.pageLabel, MARGIN + 5, 24);
    setFont(7, 'normal', [148, 163, 184]);
    const urlDisplay = page.url.length > 80 ? page.url.substring(0, 77) + '...' : page.url;
    doc.text(`${page.pageType.toUpperCase()}  ·  ${urlDisplay}`, MARGIN + 5, 30);

    y = 40;

    (['mobile', 'desktop'] as Device[]).forEach(device => {
      const pm = metrics.filter(m => m.pageId === page.pageId && m.device === device);
      if (pm.length === 0) return;

      if (y > 230) { pageBreak('Page Details (Cont.)'); y = 25; }

      const coreMetrics = pm.filter(m => m.metricName !== 'performance_score');
      const perfScore = pm.find(m => m.metricName === 'performance_score');
      const deviceCWV = cwvAssessments.find(a => a.pageId === page.pageId && a.device === device);
      const deviceCatScores = categoryScores.filter(s => s.pageId === page.pageId && s.device === device);
      const pageDiags = diagnostics
        .filter(d => d.pageId === page.pageId && d.device === device)
        .sort((a, b) => diagStatusOrder.indexOf(a.status) - diagStatusOrder.indexOf(b.status));
      const failDiags = pageDiags.filter(d => d.status === 'fail');
      const warnDiags = pageDiags.filter(d => d.status === 'warning');
      const topActionable = [...failDiags, ...warnDiags].slice(0, 8);

      // ── Device section header ──────────────────────────────────────────────
      filledRect(MARGIN, y, CONTENT_W, 8, 30, 41, 59);
      setFont(8, 'bold', [255, 255, 255]);
      const deviceLabel = device === 'mobile' ? '📱 MOBILE' : '🖥  DESKTOP';
      doc.text(deviceLabel, MARGIN + 4, y + 5.5);
      if (perfScore) {
        const scoreColor: [number, number, number] = perfScore.value >= 90 ? [74, 222, 128] : perfScore.value >= 50 ? [251, 191, 36] : [248, 113, 113];
        setFont(8, 'bold', scoreColor);
        doc.text(`Perf Score: ${perfScore.value}`, MARGIN + CONTENT_W - 35, y + 5.5);
      }
      if (deviceCWV) {
        const cwvColor: [number, number, number] = deviceCWV.status === 'passed' ? [74, 222, 128] : [248, 113, 113];
        setFont(8, 'bold', cwvColor);
        const cwvLabel = deviceCWV.status === 'passed' ? 'CWV: PASS ✓' : 'CWV: FAIL ✗';
        doc.text(cwvLabel, MARGIN + CONTENT_W - 80, y + 5.5);
      }
      y += 12;

      // ── Core Web Vitals metrics table ──────────────────────────────────────
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Metric', 'Value', 'Status', 'Good ≤', 'Data Source']],
        body: coreMetrics.map(m => [
          m.metricName,
          formatMetricValue(m.value, m.metricName),
          statusLabel(m.status),
          formatMetricValue(m.thresholdGood, m.metricName),
          m.fallbackTriggered ? 'Lab Data (LH)' : 'Field Data (PSI)'
        ]),
        headStyles: { fillColor: [51, 65, 85], fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 18 },
          2: { fontStyle: 'bold', halign: 'center', cellWidth: 25 },
          3: { textColor: [21, 128, 61], cellWidth: 22 },
          4: { textColor: [100, 116, 139], fontSize: 7 }
        },
        didParseCell: (data) => {
          if (data.section !== 'body' || data.column.index !== 2) return;
          const status = coreMetrics[data.row.index]?.status;
          if (status) {
            data.cell.styles.fillColor = statusFill(status);
            data.cell.styles.textColor = statusText(status);
          }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
      y = (doc as any).lastAutoTable.finalY + 4;

      // ── Lighthouse category scores ─────────────────────────────────────────
      if (deviceCatScores.length > 0) {
        const catRow = (['performance', 'accessibility', 'best-practices', 'seo'] as CategoryName[]).map(cat => {
          const s = deviceCatScores.find(c => c.category === cat);
          return s ? String(s.score) : '—';
        });
        autoTable(doc, {
          startY: y,
          margin: { left: MARGIN, right: MARGIN },
          head: [['Performance', 'Accessibility', 'Best Practices', 'SEO']],
          body: [catRow],
          headStyles: { fillColor: [71, 85, 105], fontSize: 7.5, fontStyle: 'bold', halign: 'center' },
          bodyStyles: { fontSize: 11, cellPadding: 3.5, halign: 'center', fontStyle: 'bold' },
          didParseCell: (data) => {
            if (data.section !== 'body') return;
            const n = parseInt(String(data.cell.raw));
            if (!isNaN(n)) {
              if (n >= 90) { data.cell.styles.fillColor = [220, 252, 231]; data.cell.styles.textColor = [21, 128, 61]; }
              else if (n >= 50) { data.cell.styles.fillColor = [254, 243, 199]; data.cell.styles.textColor = [146, 64, 14]; }
              else { data.cell.styles.fillColor = [254, 226, 226]; data.cell.styles.textColor = [185, 28, 28]; }
            }
          }
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      // ── Diagnostic insights & recommendations ─────────────────────────────
      if (topActionable.length > 0) {
        if (y > 220) { pageBreak('Diagnostic Insights (Cont.)'); y = 25; }

        setFont(9, 'bold', [15, 23, 42]);
        doc.text(`Diagnostic Insights — ${device === 'mobile' ? 'Mobile' : 'Desktop'} (${failDiags.length} fails · ${warnDiags.length} warnings)`, MARGIN, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          margin: { left: MARGIN, right: MARGIN },
          head: [['#', 'Audit Item', 'Status', 'Category', 'Savings', 'Owner', 'Recommendation']],
          body: topActionable.map((d, i) => {
            const savingsStr = d.savings
              ? d.savingsUnit === 'ms'
                ? `${(d.savings / 1000).toFixed(1)}s`
                : `${(d.savings / 1024).toFixed(0)}KB`
              : '—';
            const rec = (d.recommendation || d.description || '').substring(0, 60);
            const owner = d.suggestedOwner ? d.suggestedOwner.toUpperCase() : 'FE';
            return [
              String(i + 1),
              d.title,
              diagStatusLabel(d.status),
              d.category,
              savingsStr,
              owner,
              rec
            ];
          }),
          headStyles: { fillColor: [15, 23, 42], fontSize: 7, fontStyle: 'bold' },
          bodyStyles: { fontSize: 7, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 42, fontStyle: 'bold' },
            2: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
            3: { cellWidth: 22 },
            4: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
            5: { cellWidth: 14, halign: 'center' },
            6: { cellWidth: 'auto' }
          },
          didParseCell: (data) => {
            if (data.section !== 'body' || data.column.index !== 2) return;
            const diag = topActionable[data.row.index];
            if (diag) {
              data.cell.styles.fillColor = diagStatusFill(diag.status);
              data.cell.styles.textColor = diagStatusTextColor(diag.status);
            }
          },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        // No actionable diagnostics — show pass notice
        filledRect(MARGIN, y, CONTENT_W, 8, 220, 252, 231);
        setFont(8, 'bold', [21, 128, 61]);
        doc.text('✓  No failing or warning diagnostics for this device', MARGIN + 4, y + 5.5);
        y += 14;
      }

      y += 4;
    });
  });

  // Footer on all pages
  const pageTotal = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageTotal; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, 287, W - MARGIN, 287);
    setFont(7, 'normal', [148, 163, 184]);
    doc.text(`Run: ${auditRun.runId.substring(0,8)}  |  Generated At: ${formatDate(auditRun.generatedAt)}`, MARGIN, 292);
    doc.text(`IKSULA PERFORMANCE PILOT`, W/2, 292, { align: 'center' });
    doc.text(`Page ${i} of ${pageTotal}`, W - MARGIN, 292, { align: 'right' });
  }

  return doc;
}

export function downloadPDF(reportPackage: ReportPackage, comparisonPkg?: ReportPackage): void {
  const doc = generatePDF(reportPackage, comparisonPkg);
  doc.save(`audit-${reportPackage.auditRun.projectName.replace(/\s+/g, '-').toLowerCase()}-${reportPackage.auditRun.runId.substring(0, 8)}.pdf`);
}

export async function downloadPackage(reportPackage: ReportPackage, comparisonPkg?: ReportPackage): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Add report.json
  zip.file('report.json', JSON.stringify(reportPackage, null, 2));

  // Add report.pdf
  const doc = generatePDF(reportPackage, comparisonPkg);
  const pdfBlob = doc.output('blob');
  zip.file('report.pdf', pdfBlob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `audit-package-${reportPackage.auditRun.projectName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.zip`;

  // Generate zip
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
