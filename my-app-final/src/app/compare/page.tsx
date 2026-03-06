'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ReportPackage, ComparisonResult, ComparisonDelta } from '@/types';
import { compareReports, generateComparisonSummary, getSignificantChanges } from '@/services/comparison';
import { getAuditState } from '@/services/storage';
import { formatMetricValue, formatDate } from '@/lib/utils';
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';

export default function ComparePage() {
  const router = useRouter();
  const [baseline, setBaseline] = useState<ReportPackage | null>(null);
  const [current, setCurrent] = useState<ReportPackage | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    // Get uploaded baseline
    const uploadedBaseline = sessionStorage.getItem('uploaded-baseline');
    if (uploadedBaseline) {
      setBaseline(JSON.parse(uploadedBaseline));
    }
    
    // Get current audit from localStorage
    const currentAudit = getAuditState();
    if (currentAudit && currentAudit.run) {
      const currentPkg: ReportPackage = {
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
        evidence: []
      };
      setCurrent(currentPkg);
    }
  }, []);

  useEffect(() => {
    if (baseline && current) {
      const result = compareReports(baseline, current);
      setComparison(result);
    }
  }, [baseline, current]);

  if (!baseline || !current) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {!baseline ? 'No baseline report uploaded' : 'No current audit found'}
          </p>
          <Link href="/">
            <Button variant="outline" className="mt-4">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-500">Comparing reports...</p>
        </div>
      </div>
    );
  }

  const summary = generateComparisonSummary(comparison);
  const regressions = getSignificantChanges(comparison, 'regressed');
  const improvements = getSignificantChanges(comparison, 'improved');

  const handleDownloadComparisonPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Performance Audit Comparison', 20, 30);
    
    // Baseline info
    doc.setFontSize(12);
    doc.text('Baseline:', 20, 50);
    doc.text(`${comparison.baselineRun.projectName} - ${comparison.baselineRun.auditLabel}`, 20, 58);
    doc.text(formatDate(comparison.baselineRun.generatedAt), 20, 66);
    
    // Current info
    doc.text('Current:', 20, 80);
    doc.text(`${comparison.currentRun.projectName} - ${comparison.currentRun.auditLabel}`, 20, 88);
    doc.text(formatDate(comparison.currentRun.generatedAt), 20, 96);
    
    // Summary
    doc.text('Summary:', 20, 110);
    doc.text(`Total compared: ${summary.totalCompared}`, 30, 118);
    doc.text(`Improved: ${summary.improved}`, 30, 126);
    doc.text(`Regressed: ${summary.regressed}`, 30, 134);
    doc.text(`Unchanged: ${summary.unchanged}`, 30, 142);
    
    // Regressions
    let y = 160;
    if (regressions.length > 0) {
      doc.text('Top Regressions:', 20, y);
      y += 8;
      regressions.slice(0, 10).forEach(r => {
        doc.text(`${r.pageKey} - ${r.metricName} (${r.device}): +${formatMetricValue(r.deltaValue, r.metricName)}`, 30, y);
        y += 8;
      });
    }
    
    doc.save('comparison-report.pdf');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Compare Runs</h1>
                <p className="text-sm text-slate-500">
                  Baseline vs Current comparison
                </p>
              </div>
            </div>
            <Button onClick={handleDownloadComparisonPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Compared</p>
                  <p className="text-3xl font-bold text-slate-900">{summary.totalCompared}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Improved</p>
                  <p className="text-3xl font-bold text-green-600">{summary.improved}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Regressed</p>
                  <p className="text-3xl font-bold text-red-600">{summary.regressed}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Unchanged</p>
                  <p className="text-3xl font-bold text-slate-900">{summary.unchanged}</p>
                </div>
                <Minus className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for missing/new pages */}
        {(comparison.missingPages.length > 0 || comparison.newPages.length > 0) && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              {comparison.missingPages.length > 0 && (
                <div className="mb-4">
                  <p className="font-medium text-yellow-800">Pages in baseline but not in current:</p>
                  <p className="text-sm text-yellow-700">{comparison.missingPages.join(', ')}</p>
                </div>
              )}
              {comparison.newPages.length > 0 && (
                <div>
                  <p className="font-medium text-yellow-800">New pages in current audit:</p>
                  <p className="text-sm text-yellow-700">{comparison.newPages.join(', ')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Detailed Comparison */}
        <Tabs defaultValue="regressions">
          <TabsList className="mb-4">
            <TabsTrigger value="regressions">
              Regressions ({regressions.length})
            </TabsTrigger>
            <TabsTrigger value="improvements">
              Improvements ({improvements.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Changes ({comparison.deltas.length})
            </TabsTrigger>
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
      </main>
    </div>
  );
}

function ComparisonTable({ deltas }: { deltas: ComparisonDelta[] }) {
  if (deltas.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-slate-500">No changes in this category</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Baseline</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Direction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deltas.map((delta, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{delta.pageKey}</TableCell>
                  <TableCell>{delta.metricName}</TableCell>
                  <TableCell className="capitalize">{delta.device}</TableCell>
                  <TableCell>{formatMetricValue(delta.baselineValue, delta.metricName)}</TableCell>
                  <TableCell>{formatMetricValue(delta.currentValue, delta.metricName)}</TableCell>
                  <TableCell>±{formatMetricValue(delta.deltaValue, delta.metricName)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={delta.deltaDirection === 'improved' ? 'default' : 'destructive'}
                      className={delta.deltaDirection === 'improved' ? 'bg-green-500' : ''}
                    >
                      {delta.deltaDirection === 'improved' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {delta.deltaDirection === 'regressed' && <TrendingDown className="h-3 w-3 mr-1" />}
                      {delta.deltaDirection === 'unchanged' && <Minus className="h-3 w-3 mr-1" />}
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
