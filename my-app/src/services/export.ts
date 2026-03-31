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
import { APP_VERSION, SCHEMA_VERSION } from '@/lib/constants';

// ─── Status color helpers ─────────────────────────────────────────────────────

function statusFill(status: Status | string): [number, number, number] {
  if (status === 'good') return [220, 252, 231];
  if (status === 'needs-improvement') return [254, 243, 199];
  if (status === 'poor') return [254, 226, 226];
  return [241, 245, 249];
}

function statusText(status: Status | string): [number, number, number] {
  if (status === 'good') return [21, 128, 61];
  if (status === 'needs-improvement') return [146, 64, 14];
  if (status === 'poor') return [185, 28, 28];
  return [71, 85, 105];
}

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

// Common table style: all tables get visible borders
const BORDER_COLOR: [number, number, number] = [209, 213, 219]; // grey-300

export function generatePDF(reportPackage: ReportPackage, comparisonPkg?: ReportPackage): jsPDF {
  const { auditRun, pages, metrics, categoryScores, diagnostics, cwvAssessments } = reportPackage;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
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
    filledRect(0, 0, W, 12, 15, 23, 42);
    setFont(8, 'bold', [148, 163, 184]);
    doc.text(`${auditRun.projectName}  |  ${auditRun.auditLabel}`, MARGIN, 8);
    doc.text(title, W - MARGIN, 8, { align: 'right' });
  };

  const pageBreak = (title: string = '') => {
    doc.addPage();
    addPageHeader(title || auditRun.projectName);
  };

  // Table style with full borders
  const borderedTableStyles = {
    headStyles: {
      fillColor: [15, 23, 42] as [number, number, number],
      fontSize: 8.5,
      fontStyle: 'bold' as const,
      lineColor: BORDER_COLOR,
      lineWidth: 0.3,
      halign: 'center' as const,
      valign: 'middle' as const,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: BORDER_COLOR,
      lineWidth: 0.2,
      valign: 'middle' as const,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    tableLineColor: BORDER_COLOR,
    tableLineWidth: 0.3,
  };

  // Score color helpers for category scores
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

  // ── Overall summary stats ──────────────────────────────────────────────────
  const goodCount = metrics.filter(m => m.status === 'good').length;
  const warnCount = metrics.filter(m => m.status === 'needs-improvement').length;
  const poorCount = metrics.filter(m => m.status === 'poor').length;
  const overallHealth = calculateOverallHealth(metrics);
  const fallbackCount = metrics.filter(m => m.fallbackTriggered).length;
  const cwvPassCount = cwvAssessments.filter(a => a.status === 'passed').length;
  const cwvTotal = cwvAssessments.filter(a => a.status !== 'not-available').length;

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER & EXECUTIVE SUMMARY (with Iksula logo)
  // ══════════════════════════════════════════════════════════════════════════════

  // Navy header
  filledRect(0, 0, W, 60, 15, 23, 42);

  // Iksula logo area — text-based brand mark (replace with image when available)
  // To use actual logo: doc.addImage(logoBase64, 'PNG', MARGIN, 10, 40, 12);
  setFont(18, 'bold', [255, 255, 255]);
  doc.text('iksula', MARGIN, 20);
  setFont(7, 'normal', [148, 163, 184]);
  doc.text('www.iksula.com', MARGIN, 25);

  // Divider accent line below logo
  filledRect(MARGIN, 28, 25, 0.8, 56, 189, 248);

  // Brand label
  setFont(9, 'bold', [56, 189, 248]);
  doc.text('PERFORMANCE PILOT', MARGIN, 35);

  // Title
  setFont(24, 'bold', [255, 255, 255]);
  doc.text('Performance Audit Report', MARGIN, 48);

  // Subtitle / metadata below hero
  setFont(10, 'normal', [148, 163, 184]);
  doc.text(`${auditRun.projectName}  |  ${auditRun.auditLabel}  |  ${auditRun.environment.toUpperCase()}  |  ${formatDate(auditRun.generatedAt)}`, MARGIN, 56);

  // Overall Health Score Box
  filledRect(W - 65, 12, 50, 40, 30, 41, 59);
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
    { label: 'CWV Pass Rate', value: cwvTotal > 0 ? `${Math.round((cwvPassCount / cwvTotal) * 100)}%` : 'N/A' },
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
  const statusColors: Array<[number, number, number]> = [[34, 197, 94], [234, 179, 8], [239, 68, 68]];

  statusLabels.forEach((label, i) => {
    const barW = 80;
    const barValW = metrics.length > 0 ? (statusValues[i] / metrics.length) * barW : 0;
    filledRect(MARGIN + 60, y - 4, barW, 4, 241, 245, 249);
    filledRect(MARGIN + 60, y - 4, barValW, 4, ...statusColors[i]);
    setFont(8, 'bold', statusColors[i]);
    doc.text(label, MARGIN, y);
    setFont(9, 'bold', [15, 23, 42]);
    doc.text(String(statusValues[i]), MARGIN + 145, y);
    y += 7;
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PAGE 2 — METHODOLOGY & THRESHOLDS (fix ≤ signs)
  // ═════════════════════════════════════════════════════════════════════════════

  pageBreak('Methodology & Standards');
  y = 25;
  setFont(14, 'bold', [15, 23, 42]);
  doc.text('Audit Methodology', MARGIN, y);
  y += 6;

  const methodologyText = 'This report provides a standardized assessment of website performance based on Google\'s Core Web Vitals (CWV) and PageSpeed Insights (PSI). We prioritize Field Data (CrUX) to represent actual user experiences over the last 28 days.';
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
      ['LCP', 'Largest Contentful Paint', '<= 2.5s', '> 4.0s', 's'],
      ['INP', 'Interaction to Next Paint', '<= 200ms', '> 500ms', 'ms'],
      ['CLS', 'Cumulative Layout Shift', '<= 0.10', '> 0.25', '-'],
      ['FCP', 'First Contentful Paint', '<= 1.8s', '> 3.0s', 's'],
      ['TTFB', 'Time to First Byte', '<= 0.8s', '> 1.8s', 's'],
    ],
    ...borderedTableStyles,
    headStyles: { ...borderedTableStyles.headStyles, fontSize: 9 },
    bodyStyles: { ...borderedTableStyles.bodyStyles, fontSize: 8.5, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', halign: 'center' }, 1: { halign: 'left' }, 2: { halign: 'center', textColor: [21, 128, 61] as [number, number, number] }, 3: { halign: 'center', textColor: [185, 28, 28] as [number, number, number] }, 4: { halign: 'center' } },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // ═════════════════════════════════════════════════════════════════════════════
  // PAGE 3 — AUDITED URLS
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
    ...borderedTableStyles,
    headStyles: { ...borderedTableStyles.headStyles, fontSize: 9 },
    bodyStyles: { ...borderedTableStyles.bodyStyles, fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40, fontStyle: 'bold', halign: 'left' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 'auto' as any, overflow: 'ellipsize' as any, halign: 'left' }
    },
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // MOBILE SECTION: Detailed Results Matrix → Lighthouse Scores → CWV Assessment
  // ═════════════════════════════════════════════════════════════════════════════

  const buildMatrixBody = (device: Device) => {
    const body: any[] = [];
    pages.forEach(page => {
      const pm = metrics.filter(m => m.pageId === page.pageId && m.device === device);
      const getM = (name: string) => pm.find(m => m.metricName === name);
      body.push([
        page.pageLabel,
        getM('LCP') ? formatMetricValue(getM('LCP')!.value, 'LCP') : '-',
        getM('INP') ? formatMetricValue(getM('INP')!.value, 'INP') : '-',
        getM('CLS') ? formatMetricValue(getM('CLS')!.value, 'CLS') : '-',
        getM('FCP') ? formatMetricValue(getM('FCP')!.value, 'FCP') : '-',
        getM('TTFB') ? formatMetricValue(getM('TTFB')!.value, 'TTFB') : '-',
        getM('performance_score') ? String(getM('performance_score')!.value) : '-',
      ]);
    });
    return body;
  };

  const drawMatrixTable = (device: Device, startY: number) => {
    const matrixBody = buildMatrixBody(device);
    autoTable(doc, {
      startY,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Page Label', 'LCP', 'INP', 'CLS', 'FCP', 'TTFB', 'Score']],
      body: matrixBody,
      ...borderedTableStyles,
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, halign: 'left' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' } },
      didParseCell: (data) => {
        if (data.section !== 'body' || data.column.index < 1) return;
        const metricNames: Record<number, string> = { 1: 'LCP', 2: 'INP', 3: 'CLS', 4: 'FCP', 5: 'TTFB', 6: 'performance_score' };
        const mName = metricNames[data.column.index];
        const pageLabel = matrixBody[data.row.index][0];
        const page = pages.find(p => p.pageLabel === pageLabel);
        if (!page) return;
        const mResult = metrics.find(m => m.pageId === page.pageId && m.device === device && m.metricName === mName);
        if (mResult) {
          data.cell.styles.fillColor = statusFill(mResult.status);
          data.cell.styles.textColor = statusText(mResult.status);
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    return (doc as any).lastAutoTable.finalY;
  };

  const drawCategoryScoresTable = (device: Device, startY: number) => {
    const catBody: any[] = [];
    pages.forEach(page => {
      const cs = categoryScores.filter(s => s.pageId === page.pageId && s.device === device);
      if (cs.length === 0) return;
      const getScore = (cat: CategoryName) => {
        const s = cs.find(c => c.category === cat);
        return s ? String(s.score) : '-';
      };
      catBody.push([
        page.pageLabel,
        getScore('performance'),
        getScore('accessibility'),
        getScore('best-practices'),
        getScore('seo'),
      ]);
    });
    if (catBody.length === 0) return startY;

    autoTable(doc, {
      startY,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Page', 'Performance', 'Accessibility', 'Best Practices', 'SEO']],
      body: catBody,
      ...borderedTableStyles,
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45 },
        1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section !== 'body' || data.column.index < 1) return;
        const val = String(data.cell.raw);
        const fill = scoreColor(val);
        if (fill) {
          data.cell.styles.fillColor = fill;
          data.cell.styles.textColor = scoreTextColor(val);
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    return (doc as any).lastAutoTable.finalY;
  };

  const drawPageSpeedMetricsTable = (device: Device, startY: number) => {
    const psiMetricKeys = ['first-contentful-paint', 'total-blocking-time', 'speed-index', 'largest-contentful-paint', 'cumulative-layout-shift'];
    const psiLabels: Record<string, string> = {
      'first-contentful-paint': 'FCP',
      'total-blocking-time': 'TBT',
      'speed-index': 'Speed Index',
      'largest-contentful-paint': 'LCP',
      'cumulative-layout-shift': 'CLS',
    };
    const psiBody: any[] = [];
    pages.forEach(page => {
      const pageDiags = diagnostics.filter(d => d.pageId === page.pageId && d.device === device);
      const values = psiMetricKeys.map(key => {
        const diag = pageDiags.find(d => d.auditKey === key);
        return diag?.displayValue || '-';
      });
      if (values.some(v => v !== '-')) {
        psiBody.push([page.pageLabel, ...values]);
      }
    });
    if (psiBody.length === 0) return startY;

    autoTable(doc, {
      startY,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Page', ...psiMetricKeys.map(k => psiLabels[k])]],
      body: psiBody,
      ...borderedTableStyles,
      bodyStyles: { ...borderedTableStyles.bodyStyles, fontSize: 7.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35, halign: 'left' },
        1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' },
        4: { halign: 'center' }, 5: { halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section !== 'body' || data.column.index < 1) return;
        const key = psiMetricKeys[data.column.index - 1];
        const pageLabel = psiBody[data.row.index][0];
        const page = pages.find(p => p.pageLabel === pageLabel);
        if (!page) return;
        const diag = diagnostics.find(d => d.pageId === page.pageId && d.device === device && d.auditKey === key);
        if (diag?.score !== undefined) {
          if (diag.score >= 90) { data.cell.styles.fillColor = [220, 252, 231]; data.cell.styles.textColor = [21, 128, 61]; }
          else if (diag.score >= 50) { data.cell.styles.fillColor = [254, 243, 199]; data.cell.styles.textColor = [146, 64, 14]; }
          else { data.cell.styles.fillColor = [254, 226, 226]; data.cell.styles.textColor = [185, 28, 28]; }
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    return (doc as any).lastAutoTable.finalY;
  };

  // ── MOBILE RESULTS ─────────────────────────────────────────────────────────

  pageBreak('Mobile Results');
  y = 25;

  // Device banner
  filledRect(MARGIN, y - 5, CONTENT_W, 10, 30, 41, 59);
  setFont(10, 'bold', [255, 255, 255]);
  doc.text('MOBILE RESULTS', MARGIN + 5, y + 1.5);
  y += 12;

  setFont(12, 'bold', [15, 23, 42]);
  doc.text('Detailed Results Matrix \u2014 Mobile', MARGIN, y);
  y += 5;
  y = drawMatrixTable('mobile', y);
  y += 10;

  if (y > 200) { pageBreak('Mobile Results (Cont.)'); y = 25; }
  setFont(12, 'bold', [15, 23, 42]);
  doc.text('Lighthouse Category Scores (0\u2013100) \u2014 Mobile', MARGIN, y);
  y += 5;
  y = drawCategoryScoresTable('mobile', y);
  y += 10;

  if (y > 200) { pageBreak('Mobile Results (Cont.)'); y = 25; }
  setFont(12, 'bold', [15, 23, 42]);
  doc.text('PageSpeed Metrics \u2014 Mobile', MARGIN, y);
  y += 5;
  y = drawPageSpeedMetricsTable('mobile', y);

  // ── DESKTOP RESULTS ────────────────────────────────────────────────────────

  pageBreak('Desktop Results');
  y = 25;

  filledRect(MARGIN, y - 5, CONTENT_W, 10, 30, 41, 59);
  setFont(10, 'bold', [255, 255, 255]);
  doc.text('DESKTOP RESULTS', MARGIN + 5, y + 1.5);
  y += 12;

  setFont(12, 'bold', [15, 23, 42]);
  doc.text('Detailed Results Matrix \u2014 Desktop', MARGIN, y);
  y += 5;
  y = drawMatrixTable('desktop', y);
  y += 10;

  if (y > 200) { pageBreak('Desktop Results (Cont.)'); y = 25; }
  setFont(12, 'bold', [15, 23, 42]);
  doc.text('Lighthouse Category Scores (0\u2013100) \u2014 Desktop', MARGIN, y);
  y += 5;
  y = drawCategoryScoresTable('desktop', y);
  y += 10;

  if (y > 200) { pageBreak('Desktop Results (Cont.)'); y = 25; }
  setFont(12, 'bold', [15, 23, 42]);
  doc.text('PageSpeed Metrics \u2014 Desktop', MARGIN, y);
  y += 5;
  y = drawPageSpeedMetricsTable('desktop', y);

  // ═════════════════════════════════════════════════════════════════════════════
  // KEY FINDINGS — Mobile then Desktop
  // ═════════════════════════════════════════════════════════════════════════════

  const poorMetricsMobile = metrics.filter(m => m.status === 'poor' && m.device === 'mobile');
  const poorMetricsDesktop = metrics.filter(m => m.status === 'poor' && m.device === 'desktop');

  if (poorMetricsMobile.length > 0 || poorMetricsDesktop.length > 0) {
    pageBreak('Key Findings & Top Issues');
    y = 25;
    setFont(14, 'bold', [15, 23, 42]);
    doc.text('Key Findings & Top Issues', MARGIN, y);
    y += 6;

    const drawPoorMetricsTable = (poorList: MetricResult[], deviceLabel: string) => {
      if (poorList.length === 0) return;
      if (y > 220) { pageBreak('Key Findings (Cont.)'); y = 25; }

      filledRect(MARGIN, y, CONTENT_W, 8, 254, 226, 226);
      setFont(9, 'bold', [185, 28, 28]);
      doc.text(`${poorList.length} Critical Failure${poorList.length > 1 ? 's' : ''} \u2014 ${deviceLabel}`, MARGIN + 4, y + 5.5);
      y += 12;

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Page', 'Metric', 'Value', 'Threshold']],
        body: poorList.map(m => {
          const page = pages.find(p => p.pageId === m.pageId);
          return [
            page?.pageLabel || m.pageId,
            m.metricName,
            formatMetricValue(m.value, m.metricName),
            `> ${formatMetricValue(m.thresholdWarn, m.metricName)}`,
          ];
        }),
        ...borderedTableStyles,
        headStyles: { ...borderedTableStyles.headStyles, fillColor: [185, 28, 28] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] },
        columnStyles: { 0: { fontStyle: 'bold', halign: 'left' }, 1: { halign: 'center' }, 2: { fontStyle: 'bold', halign: 'center' }, 3: { halign: 'center' } },
        didParseCell: (data) => {
          if (data.section === 'body') {
            data.cell.styles.fillColor = [254, 242, 242];
            data.cell.styles.textColor = [127, 29, 29];
          }
        }
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    };

    drawPoorMetricsTable(poorMetricsMobile, 'Mobile');
    drawPoorMetricsTable(poorMetricsDesktop, 'Desktop');
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // TOP OPTIMIZATION OPPORTUNITIES — Mobile then Desktop
  // ═════════════════════════════════════════════════════════════════════════════

  const criticalDiagsMobile = diagnostics
    .filter(d => d.device === 'mobile' && d.status === 'fail' && d.savings && d.savings > 0)
    .sort((a, b) => (b.savings || 0) - (a.savings || 0))
    .slice(0, 15);
  const criticalDiagsDesktop = diagnostics
    .filter(d => d.device === 'desktop' && d.status === 'fail' && d.savings && d.savings > 0)
    .sort((a, b) => (b.savings || 0) - (a.savings || 0))
    .slice(0, 15);

  if (criticalDiagsMobile.length > 0 || criticalDiagsDesktop.length > 0) {
    pageBreak('Top Optimization Opportunities');
    y = 25;
    setFont(14, 'bold', [15, 23, 42]);
    doc.text('Top Optimization Opportunities (by Potential Savings)', MARGIN, y);
    y += 6;

    const drawOptTable = (diagList: DiagnosticItem[], deviceLabel: string) => {
      if (diagList.length === 0) return;
      if (y > 210) { pageBreak('Optimization Opportunities (Cont.)'); y = 25; }

      setFont(11, 'bold', [30, 41, 59]);
      doc.text(`${deviceLabel}`, MARGIN, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Rank', 'Page', 'Issue', 'Category', 'Savings']],
        body: diagList.map((d, i) => {
          const page = pages.find(p => p.pageId === d.pageId);
          const savingsStr = d.savings
            ? d.savingsUnit === 'ms' ? `${(d.savings / 1000).toFixed(1)} s` : `${(d.savings / 1024).toFixed(0)} KB`
            : '-';
          return [String(i + 1), page?.pageLabel || d.pageId, d.title, d.category, savingsStr];
        }),
        ...borderedTableStyles,
        bodyStyles: { ...borderedTableStyles.bodyStyles, fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 32, fontStyle: 'bold', halign: 'left' },
          2: { cellWidth: 'auto' as any, halign: 'left' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    };

    drawOptTable(criticalDiagsMobile, 'Mobile');
    drawOptTable(criticalDiagsDesktop, 'Desktop');
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // COMPARISON (if enabled)
  // ═════════════════════════════════════════════════════════════════════════════

  if (comparisonPkg) {
    pageBreak('Audit Comparison');
    y = 25;
    setFont(14, 'bold', [15, 23, 42]);
    doc.text('Comparison to Baseline', MARGIN, y);
    y += 5;
    setFont(9, 'normal', [71, 85, 105]);
    doc.text(`Baseline: ${comparisonPkg.auditRun.projectName} (${formatDate(comparisonPkg.auditRun.generatedAt)})`, MARGIN, y);
    y += 10;

    const baselineHealth = calculateOverallHealth(comparisonPkg.metrics);
    const healthDelta = overallHealth - baselineHealth;

    filledRect(MARGIN, y, CONTENT_W, 20, 241, 245, 249);
    setFont(10, 'bold', [30, 41, 59]);
    doc.text('Overall Health Change', MARGIN + 5, y + 8);
    setFont(12, 'bold', healthDelta > 0 ? [21, 128, 61] : healthDelta < 0 ? [185, 28, 28] : [71, 85, 105]);
    doc.text(`${healthDelta > 0 ? '+' : ''}${healthDelta}%`, MARGIN + 5, y + 15);
    y += 30;

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
            deltaRows.push([page.pageLabel, device === 'mobile' ? 'Mobile' : 'Desktop', baselineScore, currentScore, `${d > 0 ? '+' : ''}${d}`, d > 0 ? 'Improved' : 'Regressed']);
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
        ...borderedTableStyles,
        headStyles: { ...borderedTableStyles.headStyles, fillColor: [71, 85, 105] as [number, number, number] },
        columnStyles: { 0: { halign: 'left' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { fontStyle: 'bold', halign: 'center' }, 5: { fontStyle: 'bold', halign: 'center' } },
        didParseCell: (data) => {
          if (data.section !== 'body' || data.column.index !== 5) return;
          const status = String(data.cell.raw);
          if (status === 'Improved') data.cell.styles.textColor = [21, 128, 61];
          if (status === 'Regressed') data.cell.styles.textColor = [185, 28, 28];
        }
      });
    } else {
      doc.text('No significant performance shifts detected.', MARGIN, y);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // PER-PAGE DETAILED REPORT — Mobile & Desktop separated
  // ═════════════════════════════════════════════════════════════════════════════

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

  // Helper: format "Good" threshold for display
  const formatGoodThreshold = (m: MetricResult): string => {
    if (m.metricName === 'CLS') return String(m.thresholdGood);
    if (m.unit === 'ms' || m.metricName === 'LCP' || m.metricName === 'FCP' || m.metricName === 'TTFB') {
      return m.thresholdGood >= 1000 ? `${(m.thresholdGood / 1000).toFixed(1)} s` : `${m.thresholdGood} ms`;
    }
    return String(m.thresholdGood);
  };

  // Helper: data source label
  const sourceDisplayLabel = (m: MetricResult): string => {
    if (m.sourceUsed === 'pagespeed') return 'Field Data (PSI)';
    if (m.sourceUsed === 'lighthouse') return 'Lab Data (LH)';
    return String(m.sourceUsed);
  };

  pages.forEach(page => {
    (['mobile', 'desktop'] as Device[]).forEach(device => {
      const pageMetrics = metrics.filter(m => m.pageId === page.pageId && m.device === device && m.metricName !== 'performance_score');
      const perfScore = metrics.find(m => m.pageId === page.pageId && m.device === device && m.metricName === 'performance_score');
      const pageCatScores = categoryScores.filter(s => s.pageId === page.pageId && s.device === device);
      const pageDiags = diagnostics.filter(d => d.pageId === page.pageId && d.device === device && (d.status === 'fail' || d.status === 'warning'));

      // Skip device if no data at all
      if (pageMetrics.length === 0 && pageCatScores.length === 0) return;

      pageBreak('Page Report');

      // Page header banner
      filledRect(MARGIN, 16, CONTENT_W, 16, 15, 23, 42);
      setFont(13, 'bold', [255, 255, 255]);
      doc.text(page.pageLabel, MARGIN + 5, 24);
      setFont(7, 'normal', [148, 163, 184]);
      const urlDisplay = page.url.length > 80 ? page.url.substring(0, 77) + '...' : page.url;
      doc.text(`${page.pageType.toUpperCase()}  \u00B7  ${urlDisplay}`, MARGIN + 5, 30);

      y = 38;

      // ── Device header with Perf Score ──
      const deviceName = device === 'mobile' ? 'MOBILE' : 'DESKTOP';
      const perfScoreVal = perfScore ? Math.round(perfScore.value) : '-';

      filledRect(MARGIN, y, CONTENT_W, 10, 241, 245, 249);
      setFont(10, 'bold', [30, 41, 59]);
      doc.text(deviceName, MARGIN + 4, y + 7);

      // Perf score on right
      const perfScoreColor: [number, number, number] = typeof perfScoreVal === 'number'
        ? (perfScoreVal >= 90 ? [21, 128, 61] : perfScoreVal >= 50 ? [146, 64, 14] : [185, 28, 28])
        : [71, 85, 105];
      setFont(9, 'bold', perfScoreColor);
      doc.text(`Perf Score: ${perfScoreVal}`, MARGIN + CONTENT_W - 35, y + 7);
      y += 14;

      // ── Metrics table (LCP, INP, CLS, FCP, TTFB) ──
      if (pageMetrics.length > 0) {
        const metricOrder = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
        const sortedMetrics = [...pageMetrics].sort((a, b) => {
          const ai = metricOrder.indexOf(a.metricName);
          const bi = metricOrder.indexOf(b.metricName);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });

        autoTable(doc, {
          startY: y,
          margin: { left: MARGIN, right: MARGIN },
          head: [['Metric', 'Value', 'Status', 'Good <=', 'Data Source']],
          body: sortedMetrics.map(m => [
            m.metricName,
            formatMetricValue(m.value, m.metricName),
            statusLabel(m.status),
            formatGoodThreshold(m),
            sourceDisplayLabel(m),
          ]),
          ...borderedTableStyles,
          headStyles: { ...borderedTableStyles.headStyles, fontSize: 8 },
          bodyStyles: { ...borderedTableStyles.bodyStyles, fontSize: 8, cellPadding: 2.5 },
          columnStyles: {
            0: { cellWidth: 25, fontStyle: 'bold', halign: 'center' },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 'auto' as any },
          },
          didParseCell: (data) => {
            if (data.section !== 'body' || data.column.index !== 2) return;
            const m = sortedMetrics[data.row.index];
            if (m) {
              data.cell.styles.fillColor = statusFill(m.status);
              data.cell.styles.textColor = statusText(m.status);
            }
          },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      // ── Category Scores row ──
      if (pageCatScores.length > 0) {
        const getScore = (cat: CategoryName) => {
          const s = pageCatScores.find(c => c.category === cat);
          return s ? String(s.score) : '-';
        };

        autoTable(doc, {
          startY: y,
          margin: { left: MARGIN, right: MARGIN },
          head: [['Performance', 'Accessibility', 'Best Practices', 'SEO']],
          body: [[
            getScore('performance'),
            getScore('accessibility'),
            getScore('best-practices'),
            getScore('seo'),
          ]],
          ...borderedTableStyles,
          headStyles: { ...borderedTableStyles.headStyles, fontSize: 8 },
          bodyStyles: { ...borderedTableStyles.bodyStyles, fontSize: 12, cellPadding: 3, fontStyle: 'bold' as const },
          columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
          },
          didParseCell: (data) => {
            if (data.section !== 'body') return;
            const val = String(data.cell.raw);
            const fill = scoreColor(val);
            if (fill) {
              data.cell.styles.fillColor = fill;
              data.cell.styles.textColor = scoreTextColor(val);
            }
          },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      // ── PageSpeed Metrics (FCP, TBT, SI, LCP, CLS) per page ──
      {
        const psiKeys = ['first-contentful-paint', 'total-blocking-time', 'speed-index', 'largest-contentful-paint', 'cumulative-layout-shift'];
        const psiLabelsMap: Record<string, string> = {
          'first-contentful-paint': 'FCP',
          'total-blocking-time': 'TBT',
          'speed-index': 'Speed Index',
          'largest-contentful-paint': 'LCP',
          'cumulative-layout-shift': 'CLS',
        };
        const allPageDiags = diagnostics.filter(d => d.pageId === page.pageId && d.device === device);
        const psiRow = psiKeys.map(key => {
          const d = allPageDiags.find(dd => dd.auditKey === key);
          return d?.displayValue || '-';
        });
        if (psiRow.some(v => v !== '-')) {
          if (y > 230) { pageBreak('Page Report (Cont.)'); y = 25; }
          setFont(9, 'bold', [30, 41, 59]);
          doc.text(`PageSpeed Metrics \u2014 ${deviceName}`, MARGIN, y);
          y += 4;
          autoTable(doc, {
            startY: y,
            margin: { left: MARGIN, right: MARGIN },
            head: [[...psiKeys.map(k => psiLabelsMap[k])]],
            body: [psiRow],
            ...borderedTableStyles,
            headStyles: { ...borderedTableStyles.headStyles, fontSize: 8 },
            bodyStyles: { ...borderedTableStyles.bodyStyles, fontSize: 10, cellPadding: 3, fontStyle: 'bold' as const },
            columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
            didParseCell: (data) => {
              if (data.section !== 'body') return;
              const key = psiKeys[data.column.index];
              const diag = allPageDiags.find(dd => dd.auditKey === key);
              if (diag?.score !== undefined) {
                if (diag.score >= 90) { data.cell.styles.fillColor = [220, 252, 231]; data.cell.styles.textColor = [21, 128, 61]; }
                else if (diag.score >= 50) { data.cell.styles.fillColor = [254, 243, 199]; data.cell.styles.textColor = [146, 64, 14]; }
                else { data.cell.styles.fillColor = [254, 226, 226]; data.cell.styles.textColor = [185, 28, 28]; }
              }
            },
          });
          y = (doc as any).lastAutoTable.finalY + 8;
        }
      }

      // ── Diagnostic Insights (fails + warnings) ──
      if (pageDiags.length > 0) {
        const failCount = pageDiags.filter(d => d.status === 'fail').length;
        const warnDiagCount = pageDiags.filter(d => d.status === 'warning').length;

        if (y > 200) { pageBreak('Page Report (Cont.)'); y = 25; }

        setFont(10, 'bold', [30, 41, 59]);
        const diagSummary = `Diagnostic Insights \u2014 ${deviceName} (${failCount} fail${failCount !== 1 ? 's' : ''}${warnDiagCount > 0 ? ` \u00B7 ${warnDiagCount} warning${warnDiagCount !== 1 ? 's' : ''}` : ''})`;
        doc.text(diagSummary, MARGIN, y);
        y += 5;

        autoTable(doc, {
          startY: y,
          margin: { left: MARGIN, right: MARGIN },
          head: [['#', 'Audit Item', 'Status', 'Category', 'Savings', 'Owner', 'Recommendation']],
          body: pageDiags.map((d, i) => {
            const savingsStr = d.savings
              ? d.savingsUnit === 'ms' ? `${(d.savings / 1000).toFixed(1)}s` : `${(d.savings / 1024).toFixed(0)}KB`
              : '\u2014';
            const rec = (d.recommendation || d.description || '').substring(0, 60);
            return [String(i + 1), d.title, diagStatusLabel(d.status), d.category, savingsStr, d.suggestedOwner ? d.suggestedOwner.toUpperCase().substring(0, 2) : 'FE', rec];
          }),
          ...borderedTableStyles,
          headStyles: { ...borderedTableStyles.headStyles, fontSize: 7 },
          bodyStyles: { ...borderedTableStyles.bodyStyles, fontSize: 7, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 38, fontStyle: 'bold', halign: 'left' },
            2: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
            3: { cellWidth: 22, halign: 'center' },
            4: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
            5: { cellWidth: 12, halign: 'center' },
            6: { cellWidth: 'auto' as any, halign: 'left' }
          },
          didParseCell: (data) => {
            if (data.section !== 'body' || data.column.index !== 2) return;
            const diag = pageDiags[data.row.index];
            if (diag) {
              data.cell.styles.fillColor = diagStatusFill(diag.status);
              data.cell.styles.textColor = diagStatusTextColor(diag.status);
            }
          },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // FOOTER on all pages (with Iksula branding)
  // ═════════════════════════════════════════════════════════════════════════════

  const pageTotal = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageTotal; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, 287, W - MARGIN, 287);
    setFont(7, 'normal', [148, 163, 184]);
    doc.text(`Run: ${auditRun.runId.substring(0, 8)}  |  Generated: ${formatDate(auditRun.generatedAt)}`, MARGIN, 292);
    doc.text('IKSULA PERFORMANCE PILOT  |  www.iksula.com', W / 2, 292, { align: 'center' });
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

  zip.file('report.json', JSON.stringify(reportPackage, null, 2));

  const doc = generatePDF(reportPackage, comparisonPkg);
  const pdfBlob = doc.output('blob');
  zip.file('report.pdf', pdfBlob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `audit-package-${reportPackage.auditRun.projectName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.zip`;

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
