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
import { ReportPackage, ComparisonResult, ComparisonDelta, CategoryScoreDelta, CategoryName } from '@/types';
import { 
  compareReports, 
  generateComparisonSummary, 
  getSignificantChanges,
  getSignificantCategoryChanges 
} from '@/services/comparison';
import { getAuditState, getBaselineReport } from '@/services/storage';
import { formatMetricValue, formatDate, cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertCircle,
  CheckCircle2,
  FileText,
  BarChart3,
  Zap,
  ShieldCheck,
  Search,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';

export default function ComparePage() {
  const router = useRouter();
  const [baseline, setBaseline] = useState<ReportPackage | null>(null);
  const [current, setCurrent] = useState<ReportPackage | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    // Get uploaded baseline from storage
    const storedBaseline = getBaselineReport();
    if (storedBaseline) {
      setBaseline(storedBaseline);
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
        categoryScores: currentAudit.categoryScores || [],
        diagnostics: currentAudit.diagnostics || [],
        cwvAssessments: currentAudit.cwvAssessments || [],
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
            {!baseline ? 'No baseline report uploaded. Please upload a previous audit from the results page.' : 'No current audit found'}
          </p>
          <Link href="/results">
            <Button variant="outline" className="mt-4">Go to Results</Button>
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
  const categoryRegressions = getSignificantCategoryChanges(comparison, 'regressed');
  const categoryImprovements = getSignificantCategoryChanges(comparison, 'improved');

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
    doc.text(`Metrics compared: ${summary.totalCompared}`, 30, 118);
    doc.text(`Improved: ${summary.improved}`, 30, 126);
    doc.text(`Regressed: ${summary.regressed}`, 30, 134);
    doc.text(`Unchanged: ${summary.unchanged}`, 30, 142);
    
    if (summary.categoryScoresCompared > 0) {
      doc.text(`Category scores compared: ${summary.categoryScoresCompared}`, 30, 150);
      doc.text(`Category scores improved: ${summary.categoryScoresImproved}`, 30, 158);
      doc.text(`Category scores regressed: ${summary.categoryScoresRegressed}`, 30, 166);
    }
    
    // Regressions
    let y = 185;
    if (regressions.length > 0) {
      doc.text('Top Metric Regressions:', 20, y);
      y += 8;
      regressions.slice(0, 10).forEach(r => {
        doc.text(`${r.pageKey} - ${r.metricName} (${r.device}): +${formatMetricValue(r.deltaValue, r.metricName)}`, 30, y);
        y += 8;
      });
    }
    
    // Category score changes
    if (categoryRegressions.length > 0 || categoryImprovements.length > 0) {
      y += 10;
      doc.text('Category Score Changes:', 20, y);
      y += 8;
      
      [...categoryImprovements, ...categoryRegressions].slice(0, 10).forEach(c => {
        const sign = c.deltaDirection === 'improved' ? '+' : '-';
        doc.text(`${c.pageKey} - ${c.category} (${c.device}): ${sign}${c.delta} points`, 30, y);
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
              <Link href="/results">
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
        {/* Run Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-widest text-slate-500 uppercase">Baseline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-slate-900">{comparison.baselineRun.auditLabel}</p>
              <p className="text-sm text-slate-500">{comparison.baselineRun.projectName}</p>
              <p className="text-xs text-slate-400 mt-1">{formatDate(comparison.baselineRun.generatedAt)}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-widest text-blue-600 uppercase">Current</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-slate-900">{comparison.currentRun.auditLabel}</p>
              <p className="text-sm text-slate-500">{comparison.currentRun.projectName}</p>
              <p className="text-xs text-slate-400 mt-1">{formatDate(comparison.currentRun.generatedAt)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Metrics Compared</p>
                  <p className="text-3xl font-bold text-slate-900">{summary.totalCompared}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
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

        {/* Category Score Summary */}
        {summary.categoryScoresCompared > 0 && (
          <Card className="mb-8 border-indigo-200 bg-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-indigo-900">Category Score Changes</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <span className="text-sm text-slate-600">Improved</span>
                  <span className="text-lg font-bold text-green-600">{summary.categoryScoresImproved}</span>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <span className="text-sm text-slate-600">Regressed</span>
                  <span className="text-lg font-bold text-red-600">{summary.categoryScoresRegressed}</span>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <span className="text-sm text-slate-600">Unchanged</span>
                  <span className="text-lg font-bold text-slate-900">{summary.categoryScoresUnchanged}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
        <Tabs defaultValue="metrics">
          <TabsList className="mb-4">
            <TabsTrigger value="metrics">
              Metrics ({comparison.deltas.length})
            </TabsTrigger>
            <TabsTrigger value="categories">
              Category Scores ({comparison.categoryScoreDeltas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <Tabs defaultValue="regressions">
              <TabsList className="mb-4">
                <TabsTrigger value="regressions">
                  Regressions ({regressions.length})
                </TabsTrigger>
                <TabsTrigger value="improvements">
                  Improvements ({improvements.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  All ({comparison.deltas.length})
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
          </TabsContent>

          <TabsContent value="categories">
            <Tabs defaultValue="regressions">
              <TabsList className="mb-4">
                <TabsTrigger value="regressions">
                  Regressions ({categoryRegressions.length})
                </TabsTrigger>
                <TabsTrigger value="improvements">
                  Improvements ({categoryImprovements.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  All ({comparison.categoryScoreDeltas.length})
                </TabsTrigger>
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

function CategoryComparisonTable({ deltas }: { deltas: CategoryScoreDelta[] }) {
  if (deltas.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-slate-500">No category score changes in this category</p>
        </CardContent>
      </Card>
    );
  }

  const getCategoryIcon = (category: CategoryName) => {
    switch (category) {
      case 'performance': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'accessibility': return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      case 'best-practices': return <CheckCircle2 className="h-4 w-4 text-indigo-500" />;
      case 'seo': return <Search className="h-4 w-4 text-amber-500" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Category</TableHead>
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
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(delta.category)}
                      <span className="capitalize">{delta.category.replace(/-/g, ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{delta.device}</TableCell>
                  <TableCell>{delta.baselineScore}</TableCell>
                  <TableCell>{delta.currentScore}</TableCell>
                  <TableCell>±{delta.delta}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={delta.deltaDirection === 'improved' ? 'default' : 'destructive'}
                      className={cn(
                        delta.deltaDirection === 'improved' ? 'bg-green-500' : '',
                        delta.deltaDirection === 'regressed' ? 'bg-red-500' : ''
                      )}
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
