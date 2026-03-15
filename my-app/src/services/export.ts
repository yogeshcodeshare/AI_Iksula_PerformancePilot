// Export service - PDF and JSON generation
import { 
  ReportPackage, 
  AuditRun, 
  AuditPage, 
  MetricResult, 
  CategoryScore, 
  DiagnosticItem,
  CWVAssessment,
  Device,
  CategoryName
} from '@/types';
import jsPDF from 'jspdf';
import { formatDate, formatMetricValue, getStatusColor, cn } from '@/lib/utils';
import { THRESHOLDS, APP_VERSION, SCHEMA_VERSION, STATUS_LABELS } from '@/lib/constants';

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
    pages,
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
  link.download = `audit-${reportPackage.auditRun.runId}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generatePDF(reportPackage: ReportPackage): jsPDF {
  const { auditRun, pages, metrics, categoryScores, diagnostics, cwvAssessments } = reportPackage;
  const doc = new jsPDF();
  
  // Helper to add text
  const addText = (text: string, x: number, y: number, size = 12, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(text, x, y);
  };
  
  // Helper to add colored text (using gray scale for PDF compatibility)
  const getStatusColorPDF = (status: string): [number, number, number] => {
    switch (status) {
      case 'good':
      case 'pass':
      case 'passed':
        return [34, 197, 94]; // green
      case 'needs-improvement':
      case 'warning':
        return [234, 179, 8]; // yellow
      case 'poor':
      case 'fail':
      case 'failed':
        return [239, 68, 68]; // red
      default:
        return [100, 116, 139]; // slate
    }
  };
  
  // Cover Page
  addText('Website Performance Audit Report', 20, 30, 24, true);
  addText(`Project: ${auditRun.projectName}`, 20, 50, 14);
  addText(`Audit: ${auditRun.auditLabel}`, 20, 60, 14);
  addText(`Environment: ${auditRun.environment}`, 20, 70, 12);
  if (auditRun.deploymentTag) {
    addText(`Deployment Tag: ${auditRun.deploymentTag}`, 20, 80, 12);
  }
  addText(`Generated: ${formatDate(auditRun.generatedAt)}`, 20, 95, 12);
  addText(`Schema Version: ${auditRun.schemaVersion}`, 20, 105, 10);
  
  // Methodology
  doc.addPage();
  addText('Methodology', 20, 30, 18, true);
  addText('This audit follows the Core Web Vitals methodology with:', 20, 45, 12);
  addText('• PageSpeed Insights as primary data source', 25, 55, 11);
  addText('• Lighthouse as fallback when PageSpeed is unavailable', 25, 63, 11);
  addText('• Mobile and Desktop testing for each page', 25, 71, 11);
  addText('• Category scoring: Performance, Accessibility, Best Practices, SEO', 25, 79, 11);
  
  addText('Thresholds Used:', 20, 95, 12, true);
  let y = 105;
  Object.entries(THRESHOLDS).forEach(([key, config]) => {
    if (key !== 'performance_score') {
      addText(`${config.name} (${key}):`, 25, y, 10);
      addText(`  Good: \u2264${config.good}${config.unit} | Needs Improvement: \u2264${config.warn}${config.unit}`, 30, y + 5, 9);
      y += 12;
    }
  });
  
  // Audit Scope
  doc.addPage();
  addText('Audit Scope', 20, 30, 18, true);
  addText(`${pages.length} pages audited:`, 20, 45, 12);
  y = 55;
  pages.forEach((page, i) => {
    addText(`${i + 1}. ${page.pageLabel} (${page.pageType})`, 25, y, 10);
    addText(`   ${page.url}`, 30, y + 5, 9);
    y += 12;
    if (y > 270) {
      doc.addPage();
      y = 30;
    }
  });
  
  // Cross-Page Results Matrix
  doc.addPage();
  addText('Cross-Page Results Matrix', 20, 30, 18, true);
  
  // Table header
  y = 50;
  addText('Page', 20, y, 9, true);
  addText('LCP (M)', 70, y, 8, true);
  addText('LCP (D)', 95, y, 8, true);
  addText('INP (M)', 120, y, 8, true);
  addText('INP (D)', 145, y, 8, true);
  addText('CLS (M)', 170, y, 8, true);
  addText('CLS (D)', 195, y, 8, true);
  
  y = 60;
  pages.forEach(page => {
    const pageMetrics = metrics.filter(m => m.pageId === page.pageId);
    
    const getMetricValue = (name: string, device: string) => {
      const m = pageMetrics.find(x => x.metricName === name && x.device === device);
      return m ? formatMetricValue(m.value, m.metricName) : 'N/A';
    };
    
    addText(page.pageLabel.substring(0, 20), 20, y, 8);
    addText(getMetricValue('LCP', 'mobile'), 70, y, 8);
    addText(getMetricValue('LCP', 'desktop'), 95, y, 8);
    addText(getMetricValue('INP', 'mobile'), 120, y, 8);
    addText(getMetricValue('INP', 'desktop'), 145, y, 8);
    addText(getMetricValue('CLS', 'mobile'), 170, y, 8);
    addText(getMetricValue('CLS', 'desktop'), 195, y, 8);
    
    y += 8;
    if (y > 270) {
      doc.addPage();
      y = 30;
    }
  });
  
  // Category Scores Summary
  if (categoryScores.length > 0) {
    doc.addPage();
    addText('Category Scores Summary', 20, 30, 18, true);
    
    y = 50;
    addText('Page', 20, y, 9, true);
    addText('Device', 70, y, 8, true);
    addText('Performance', 100, y, 8, true);
    addText('A11y', 135, y, 8, true);
    addText('Best Practices', 160, y, 8, true);
    addText('SEO', 195, y, 8, true);
    
    y = 60;
    pages.forEach(page => {
      ['mobile', 'desktop'].forEach(device => {
        const scores = categoryScores.filter(cs => cs.pageId === page.pageId && cs.device === device);
        
        const getScore = (cat: CategoryName) => {
          const s = scores.find(x => x.category === cat);
          return s ? `${s.score}` : 'N/A';
        };
        
        addText(page.pageLabel.substring(0, 20), 20, y, 8);
        addText(device === 'mobile' ? 'M' : 'D', 70, y, 8);
        addText(getScore('performance'), 100, y, 8);
        addText(getScore('accessibility'), 135, y, 8);
        addText(getScore('best-practices'), 160, y, 8);
        addText(getScore('seo'), 195, y, 8);
        
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 30;
        }
      });
    });
  }
  
  // Per-Page Details
  pages.forEach(page => {
    doc.addPage();
    addText(`${page.pageLabel} Details`, 20, 30, 16, true);
    addText(`URL: ${page.url}`, 20, 45, 10);
    addText(`Type: ${page.pageType}`, 20, 52, 10);
    
    y = 70;
    
    ['mobile', 'desktop'].forEach(device => {
      // Check if we have any data for this device
      const deviceMetrics = metrics.filter(m => m.pageId === page.pageId && m.device === device);
      if (deviceMetrics.length === 0) return;
      
      addText(`${device.toUpperCase()} Results:`, 20, y, 12, true);
      y += 10;
      
      // Core Web Vitals Assessment
      const assessment = cwvAssessments.find(
        a => a.pageId === page.pageId && a.device === device
      );
      
      if (assessment) {
        addText('Core Web Vitals Assessment:', 25, y, 10, true);
        y += 6;
        addText(`  Status: ${assessment.status === 'passed' ? 'PASSED' : assessment.status === 'failed' ? 'FAILED' : 'NOT AVAILABLE'}`, 30, y, 9);
        y += 5;
        addText(`  Interpretation: ${assessment.interpretation.substring(0, 80)}...`, 30, y, 8);
        y += 8;
        
        // Individual CWV metrics
        if (assessment.lcp) {
          addText(`  LCP: ${assessment.lcp.displayValue} (${assessment.lcp.status})`, 30, y, 9);
          y += 5;
        }
        if (assessment.inp) {
          addText(`  INP: ${assessment.inp.displayValue} (${assessment.inp.status})`, 30, y, 9);
          y += 5;
        }
        if (assessment.cls) {
          addText(`  CLS: ${assessment.cls.displayValue} (${assessment.cls.status})`, 30, y, 9);
          y += 5;
        }
        y += 5;
      }
      
      // Metrics
      addText('Web Vitals Metrics:', 25, y, 10, true);
      y += 6;
      
      deviceMetrics.forEach(m => {
        const status = m.status.toUpperCase();
        const source = m.sourceUsed === 'pagespeed' ? 'PageSpeed' : 'Lighthouse';
        const fallback = m.fallbackTriggered ? ` (Fallback: ${m.fallbackReason?.substring(0, 30) || 'Yes'})` : '';
        
        addText(`  ${m.metricName}: ${formatMetricValue(m.value, m.metricName)} [${status}] via ${source}${fallback}`, 30, y, 9);
        y += 5;
        
        if (y > 270) {
          doc.addPage();
          y = 30;
        }
      });
      
      y += 5;
      
      // Category Scores
      const deviceScores = categoryScores.filter(cs => cs.pageId === page.pageId && cs.device === device);
      if (deviceScores.length > 0) {
        addText('Category Scores:', 25, y, 10, true);
        y += 6;
        
        deviceScores.forEach(cs => {
          addText(`  ${cs.category}: ${cs.score}/100`, 30, y, 9);
          y += 5;
          
          if (y > 270) {
            doc.addPage();
            y = 30;
          }
        });
        
        y += 5;
      }
      
      // Diagnostics Summary (Top Issues)
      const deviceDiagnostics = diagnostics.filter(
        d => d.pageId === page.pageId && d.device === device && (d.status === 'fail' || d.status === 'warning')
      );
      
      if (deviceDiagnostics.length > 0) {
        addText('Top Issues:', 25, y, 10, true);
        y += 6;
        
        deviceDiagnostics.slice(0, 10).forEach(d => {
          const status = d.status.toUpperCase();
          addText(`  [${status}] ${d.title.substring(0, 60)}${d.title.length > 60 ? '...' : ''}`, 30, y, 8);
          y += 5;
          
          if (d.displayValue) {
            addText(`    Value: ${d.displayValue}`, 35, y, 8);
            y += 4;
          }
          
          if (y > 270) {
            doc.addPage();
            y = 30;
          }
        });
        
        if (deviceDiagnostics.length > 10) {
          addText(`  ... and ${deviceDiagnostics.length - 10} more issues`, 30, y, 8);
          y += 5;
        }
        
        y += 5;
      }
      
      y += 10;
      
      if (y > 250) {
        doc.addPage();
        y = 30;
      }
    });
  });
  
  // Appendix
  doc.addPage();
  addText('Appendix', 20, 30, 18, true);
  addText('Report Metadata', 20, 50, 12, true);
  addText(`Run ID: ${auditRun.runId}`, 25, 60, 10);
  addText(`Schema Version: ${auditRun.schemaVersion}`, 25, 68, 10);
  addText(`Generated At: ${formatDate(auditRun.generatedAt)}`, 25, 76, 10);
  addText(`Total Pages: ${pages.length}`, 25, 84, 10);
  addText(`Total Metrics: ${metrics.length}`, 25, 92, 10);
  addText(`Total Diagnostics: ${diagnostics.length}`, 25, 100, 10);
  
  addText('Source Policy', 20, 115, 12, true);
  addText('This report uses PageSpeed Insights as the primary data source.', 25, 125, 10);
  addText('Lighthouse is used as a fallback when PageSpeed is unavailable.', 25, 133, 10);
  addText('All data sources and fallbacks are clearly labeled in the report.', 25, 141, 10);
  
  return doc;
}

export function downloadPDF(reportPackage: ReportPackage): void {
  const doc = generatePDF(reportPackage);
  doc.save(`audit-${reportPackage.auditRun.runId}.pdf`);
}

export async function downloadPackage(reportPackage: ReportPackage): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  // Add report.json
  zip.file('report.json', JSON.stringify(reportPackage, null, 2));
  
  // Add metadata.json
  zip.file('metadata.json', JSON.stringify(reportPackage.metadata, null, 2));
  
  // Add report.pdf
  const doc = generatePDF(reportPackage);
  const pdfBlob = doc.output('blob');
  zip.file('report.pdf', pdfBlob);
  
  // Generate zip
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-package-${reportPackage.auditRun.runId}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
