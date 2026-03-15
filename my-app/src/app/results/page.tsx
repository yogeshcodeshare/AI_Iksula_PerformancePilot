'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { AuditState, MetricResult, Device, CategoryName, ReportPackage } from '@/types';
import { generateReportPackage, downloadJSON, downloadPDF, downloadPackage } from '@/services/export';
import { getAuditState, getAuditStateAsync, getBaselineReport, saveBaselineReport } from '@/services/storage';
import { compareReports, generateComparisonSummary } from '@/services/comparison';
import {
  formatMetricValue,
  formatDate,
  getStatusColor,
  calculateOverallHealth
} from '@/lib/utils';
import {
  ArrowLeft,
  Download,
  FileText,
  Package,
  Smartphone,
  Monitor,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  ChevronRight,
  Zap,
  Filter,
  ArrowUpRight,
  Globe,
  Clock,
  Activity,
  Upload,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Info,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { CWVAssessmentCard } from '@/components/results/CWVAssessmentCard';
import { CategoryScoreCards } from '@/components/results/CategoryScoreCards';
import { DiagnosticsPanel } from '@/components/results/DiagnosticsPanel';
import { cn } from '@/lib/utils';

export default function ResultsPage() {
  const router = useRouter();
  const [auditState, setAuditState] = useState<AuditState | null>(null);
  const [activeTab, setActiveTab] = useState('mobile');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Workspace active selections
  const [workspacePage, setWorkspacePage] = useState<string>('');
  const [workspaceDevice, setWorkspaceDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [workspaceCategory, setWorkspaceCategory] = useState<CategoryName>('performance');

  // Comparison state
  const [baselineReport, setBaselineReport] = useState<ReportPackage | null>(null);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadAuditState();
    loadBaselineReport();
  }, []);

  const loadAuditState = async () => {
    setIsLoading(true);

    // Try to get from session first (for immediate results)
    const sessionData = sessionStorage.getItem('current-audit-state');

    if (sessionData) {
      try {
        const state = JSON.parse(sessionData);

        // Ensure new fields exist
        if (!state.categoryScores) state.categoryScores = [];
        if (!state.diagnostics) state.diagnostics = [];
        if (!state.cwvAssessments) state.cwvAssessments = [];

        setAuditState(state);
        if (state.pages && state.pages.length > 0) {
          setWorkspacePage(state.pages[0].pageId);
        }
        setIsLoading(false);
        return;
      } catch (e) {
        console.error('Failed to parse session data:', e);
      }
    }

    // Fallback to IndexedDB/localStorage (Async version handles both)
    const stored = await getAuditStateAsync();

    if (stored) {
      setAuditState(stored);
      if (stored.pages && stored.pages.length > 0) {
        setWorkspacePage(stored.pages[0].pageId);
      }
      setIsLoading(false);
    } else {
      console.log('[Results] No data found, redirecting to home');
      router.push('/');
    }
  };

  const loadBaselineReport = () => {
    const baseline = getBaselineReport();
    if (baseline) {
      setBaselineReport(baseline);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        // Validate schema
        if (!parsed.auditRun || !parsed.pages || !parsed.metrics) {
          setUploadError('Invalid report format. Missing required fields.');
          return;
        }

        // Ensure new fields exist for backward compatibility
        if (!parsed.categoryScores) parsed.categoryScores = [];
        if (!parsed.diagnostics) parsed.diagnostics = [];
        if (!parsed.cwvAssessments) parsed.cwvAssessments = [];

        saveBaselineReport(parsed);
        setBaselineReport(parsed);
        setComparisonDialogOpen(false);
      } catch (error) {
        setUploadError('Failed to parse JSON file. Please ensure it is a valid audit report.');
      }
    };
    reader.readAsText(file);
  };

  const clearBaseline = () => {
    setBaselineReport(null);
  };

  const comparison = auditState && baselineReport
    ? compareReports(baselineReport, generateReportPackage(
      auditState.run!,
      auditState.pages,
      auditState.metrics,
      auditState.categoryScores,
      auditState.diagnostics,
      auditState.cwvAssessments
    ))
    : null;

  const comparisonSummary = comparison ? generateComparisonSummary(comparison) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-500">Loading audit results...</p>
        </div>
      </div>
    );
  }

  if (!auditState || !auditState.run) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-2">No audit data found</p>
          <p className="text-slate-500 text-sm mb-4">
            You need to run an audit first before viewing results.
            Data is stored temporarily and will be lost if you refresh the page.
          </p>
          <div className="flex gap-2 justify-center mb-4">
            <Link href="/audit">
              <Button>Start New Audit</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Load sample data for testing
              const sampleState = {
                run: {
                  runId: 'sample-run-001',
                  projectName: 'Sample Project',
                  auditLabel: 'Test Audit',
                  environment: 'production',
                  generatedAt: new Date().toISOString(),
                  schemaVersion: '1.0.0'
                },
                pages: [
                  { pageId: 'page-1', runId: 'sample-run-001', pageLabel: 'Homepage', pageType: 'homepage', url: 'https://example.com', sortOrder: 0 },
                  { pageId: 'page-2', runId: 'sample-run-001', pageLabel: 'Products', pageType: 'category', url: 'https://example.com/products', sortOrder: 1 }
                ],
                metrics: [
                  { pageId: 'page-1', device: 'mobile', metricName: 'LCP', value: 2500, unit: 'ms', thresholdGood: 2500, thresholdWarn: 4000, status: 'good', sourceAttempted: 'pagespeed', sourceUsed: 'pagespeed', fallbackTriggered: false, capturedAt: new Date().toISOString() },
                  { pageId: 'page-1', device: 'mobile', metricName: 'INP', value: 150, unit: 'ms', thresholdGood: 200, thresholdWarn: 500, status: 'good', sourceAttempted: 'pagespeed', sourceUsed: 'pagespeed', fallbackTriggered: false, capturedAt: new Date().toISOString() },
                  { pageId: 'page-1', device: 'mobile', metricName: 'CLS', value: 0.05, unit: '', thresholdGood: 0.1, thresholdWarn: 0.25, status: 'good', sourceAttempted: 'pagespeed', sourceUsed: 'pagespeed', fallbackTriggered: false, capturedAt: new Date().toISOString() },
                  { pageId: 'page-1', device: 'mobile', metricName: 'FCP', value: 1200, unit: 'ms', thresholdGood: 1800, thresholdWarn: 3000, status: 'good', sourceAttempted: 'pagespeed', sourceUsed: 'pagespeed', fallbackTriggered: false, capturedAt: new Date().toISOString() },
                  { pageId: 'page-1', device: 'mobile', metricName: 'TTFB', value: 600, unit: 'ms', thresholdGood: 800, thresholdWarn: 1800, status: 'good', sourceAttempted: 'pagespeed', sourceUsed: 'pagespeed', fallbackTriggered: false, capturedAt: new Date().toISOString() },
                  { pageId: 'page-1', device: 'desktop', metricName: 'LCP', value: 1800, unit: 'ms', thresholdGood: 2500, thresholdWarn: 4000, status: 'good', sourceAttempted: 'pagespeed', sourceUsed: 'pagespeed', fallbackTriggered: false, capturedAt: new Date().toISOString() },
                  { pageId: 'page-1', device: 'desktop', metricName: 'INP', value: 80, unit: 'ms', thresholdGood: 200, thresholdWarn: 500, status: 'good', sourceAttempted: 'pagespeed', sourceUsed: 'pagespeed', fallbackTriggered: false, capturedAt: new Date().toISOString() },
                  { pageId: 'page-1', device: 'desktop', metricName: 'CLS', value: 0.02, unit: '', thresholdGood: 0.1, thresholdWarn: 0.25, status: 'good', sourceAttempted: 'pagespeed', sourceUsed: 'pagespeed', fallbackTriggered: false, capturedAt: new Date().toISOString() },
                  { pageId: 'page-2', device: 'mobile', metricName: 'LCP', value: 3200, unit: 'ms', thresholdGood: 2500, thresholdWarn: 4000, status: 'needs-improvement', sourceAttempted: 'pagespeed', sourceUsed: 'pagespeed', fallbackTriggered: false, capturedAt: new Date().toISOString() },
                ],
                categoryScores: [
                  { pageId: 'page-1', device: 'mobile', category: 'performance', score: 85, source: 'pagespeed', capturedAt: new Date().toISOString() },
                  { pageId: 'page-1', device: 'mobile', category: 'accessibility', score: 92, source: 'pagespeed', capturedAt: new Date().toISOString() },
                  { pageId: 'page-1', device: 'mobile', category: 'best-practices', score: 78, source: 'pagespeed', capturedAt: new Date().toISOString() },
                  { pageId: 'page-1', device: 'mobile', category: 'seo', score: 95, source: 'pagespeed', capturedAt: new Date().toISOString() },
                  { pageId: 'page-1', device: 'desktop', category: 'performance', score: 92, source: 'pagespeed', capturedAt: new Date().toISOString() },
                ],
                diagnostics: [
                  { id: 'diag-1', pageId: 'page-1', device: 'mobile', category: 'performance', group: 'insights', auditKey: 'unused-javascript', title: 'Reduce unused JavaScript', description: 'Remove unused JavaScript to reduce bytes consumed by network activity.', status: 'fail', scoreDisplayMode: 'binary', score: 0, displayValue: '1.5s', source: 'pagespeed', capturedAt: new Date().toISOString() },
                  { id: 'diag-2', pageId: 'page-1', device: 'mobile', category: 'performance', group: 'insights', auditKey: 'modern-image-formats', title: 'Serve modern image formats', description: 'Image formats like WebP and AVIF often provide better compression.', status: 'fail', scoreDisplayMode: 'binary', score: 0, displayValue: '450KB', source: 'pagespeed', capturedAt: new Date().toISOString() },
                  { id: 'diag-3', pageId: 'page-1', device: 'mobile', category: 'accessibility', group: 'aria', auditKey: 'aria-roles', title: 'ARIA roles are valid', description: 'Screen readers require valid ARIA roles.', status: 'pass', scoreDisplayMode: 'binary', score: 1, source: 'pagespeed', capturedAt: new Date().toISOString() },
                ],
                cwvAssessments: [
                  { pageId: 'page-1', device: 'mobile', passed: true, status: 'passed', lcp: { value: 2500, displayValue: '2.5s', status: 'good' }, inp: { value: 150, displayValue: '150ms', status: 'good' }, cls: { value: 0.05, displayValue: '0.050', status: 'good' }, fcp: { value: 1200, displayValue: '1.2s', status: 'good' }, ttfb: { value: 600, displayValue: '600ms', status: 'good' }, interpretation: 'This page passes Core Web Vitals on mobile.', source: 'pagespeed', fallbackTriggered: false, capturedAt: new Date().toISOString() },
                  { pageId: 'page-1', device: 'desktop', passed: true, status: 'passed', lcp: { value: 1800, displayValue: '1.8s', status: 'good' }, inp: { value: 80, displayValue: '80ms', status: 'good' }, cls: { value: 0.02, displayValue: '0.020', status: 'good' }, fcp: { value: 900, displayValue: '0.9s', status: 'good' }, ttfb: { value: 400, displayValue: '400ms', status: 'good' }, interpretation: 'This page passes Core Web Vitals on desktop.', source: 'pagespeed', fallbackTriggered: false, capturedAt: new Date().toISOString() },
                ],
                status: 'completed',
                progress: { total: 4, completed: 4 }
              };
              sessionStorage.setItem('current-audit-state', JSON.stringify(sampleState));
              window.location.reload();
            }}
          >
            Load Demo Data
          </Button>
        </div>
      </div>
    );
  }

  const { run, pages, metrics, categoryScores = [], diagnostics = [], cwvAssessments = [] } = auditState;

  // Filter pages for Detailed Results list
  const filteredPages = pages.filter(p =>
    p.pageLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate summary stats
  const goodCount = metrics.filter(m => m.status === 'good').length;
  const warnCount = metrics.filter(m => m.status === 'needs-improvement').length;
  const poorCount = metrics.filter(m => m.status === 'poor').length;
  const overallHealth = calculateOverallHealth(metrics);
  const fallbackCount = metrics.filter(m => m.fallbackTriggered).length;

  const statusData = [
    { name: 'Good', value: goodCount, color: '#22c55e' },
    { name: 'Needs Improvement', value: warnCount, color: '#eab308' },
    { name: 'Poor', value: poorCount, color: '#ef4444' },
  ];

  const pageHealthData = pages.map(page => {
    const pageMetrics = metrics.filter(m => m.pageId === page.pageId);
    const health = calculateOverallHealth(pageMetrics);
    return {
      name: page.pageLabel.substring(0, 15),
      health
    };
  });

  const handleDownloadJSON = () => {
    const pkg = generateReportPackage(run, pages, metrics, categoryScores, diagnostics, cwvAssessments);
    downloadJSON(pkg);
  };

  const handleDownloadPDF = () => {
    const pkg = generateReportPackage(run, pages, metrics, categoryScores, diagnostics, cwvAssessments);
    downloadPDF(pkg);
  };

  const handleDownloadPackage = async () => {
    const pkg = generateReportPackage(run, pages, metrics, categoryScores, diagnostics, cwvAssessments);
    await downloadPackage(pkg);
  };

  // Workspace active page data
  const actPage = pages.find(p => p.pageId === workspacePage) || pages[0];
  const actPageMetrics = metrics.filter(m => m.pageId === actPage?.pageId && m.device === workspaceDevice);
  const actSourceUsed = actPageMetrics[0]?.sourceUsed || 'pagespeed';
  const actFallbackTriggered = actPageMetrics[0]?.fallbackTriggered || false;
  const actFallbackReason = actPageMetrics[0]?.fallbackReason;

  // Get CWV Assessment for active page/device
  const actCWVAssessment = cwvAssessments.find(
    a => a.pageId === actPage?.pageId && a.device === workspaceDevice
  ) || null;

  // Get category scores for active page/device
  const actCategoryScores = categoryScores.filter(
    cs => cs.pageId === actPage?.pageId && cs.device === workspaceDevice
  );

  // Get baseline category scores for comparison
  const baselineCategoryScores = baselineReport?.categoryScores?.filter(
    cs => {
      const baselinePage = baselineReport.pages.find(p => p.pageId === cs.pageId);
      const currentPage = actPage;
      return baselinePage && currentPage &&
        baselinePage.url === currentPage.url &&
        baselinePage.pageType === currentPage.pageType &&
        cs.device === workspaceDevice;
    }
  ) || [];

  // Filter diagnostics for active page/device/category
  const actDiagnostics = diagnostics.filter(
    d => d.category === workspaceCategory &&
      d.device === workspaceDevice &&
      d.pageId === actPage?.pageId
  );

  // Get page comparison data
  const getPageComparisonData = (pageId: string, device: Device) => {
    if (!comparison) return null;
    return comparison.deltas.filter(d =>
      d.pageKey === pages.find(p => p.pageId === pageId)?.pageLabel &&
      d.device === device
    );
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] pb-24">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Link href="/" className="hover:text-slate-900">Dashboard</Link>
              <ChevronRight className="w-3 h-3" />
              <span>Audits</span>
              <ChevronRight className="w-3 h-3" />
              <span className="font-medium text-slate-900">#{run.runId.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8 text-slate-500">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Audit Results</h1>
              <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-200">{run.environment} Run</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">

            {/* Compare Button */}
            <Dialog open={comparisonDialogOpen} onOpenChange={setComparisonDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant={baselineReport ? "default" : "outline"}
                  className={cn(
                    "border-slate-200",
                    baselineReport ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-white"
                  )}
                >
                  <GitCompare className="h-4 w-4 mr-2" />
                  {baselineReport ? 'Comparing' : 'Compare'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Compare with Previous Report</DialogTitle>
                  <DialogDescription>
                    Upload a previous audit report JSON file to compare against current results.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {baselineReport ? (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{baselineReport.auditRun.auditLabel}</p>
                          <p className="text-sm text-slate-500">
                            {formatDate(baselineReport.auditRun.generatedAt)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearBaseline}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-8">
                      <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 mb-4">Upload audit report JSON</p>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="max-w-xs"
                      />
                    </div>
                  )}
                  {uploadError && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {uploadError}
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleDownloadJSON} className="bg-white border-slate-200">
              <FileText className="h-4 w-4 mr-2" /> Export JSON
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} className="bg-white border-slate-200">
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
            <Button onClick={handleDownloadPackage} className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
              <Package className="h-4 w-4 mr-2" /> Full Package
            </Button>
          </div>
        </div>

        {/* Comparison Summary Banner */}
        {comparisonSummary && (
          <Card className="mt-6 bg-indigo-50 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <GitCompare className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-indigo-900">
                      Comparing with {baselineReport?.auditRun.auditLabel}
                    </p>
                    <p className="text-xs text-indigo-600">
                      {comparisonSummary.improved} improvements, {comparisonSummary.regressed} regressions
                      {comparisonSummary.categoryScoresImproved > 0 && `, ${comparisonSummary.categoryScoresImproved} category scores improved`}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearBaseline} className="text-indigo-600">
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 mb-8">
          <Card className="rounded-xl shadow-sm border-slate-200 relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${overallHealth >= 80 ? 'bg-green-500' : overallHealth >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">Overall Health</p>
                <div className="flex items-center gap-2">
                  <p className="text-4xl font-black text-slate-900">{overallHealth}%</p>
                </div>
              </div>
              <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                <Zap className={`h-5 w-5 ${overallHealth >= 80 ? 'text-green-500' : overallHealth >= 50 ? 'text-amber-500' : 'text-red-500'}`} fill={overallHealth >= 80 ? "#22c55e" : "transparent"} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-slate-200">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">Pages Audited</p>
                <div className="flex items-center gap-2">
                  <p className="text-4xl font-black text-slate-900">{pages.length}</p>
                </div>
              </div>
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-slate-200">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">Metrics Collected</p>
                <div className="flex items-center gap-2">
                  <p className="text-4xl font-black text-slate-900">{metrics.length}</p>
                </div>
              </div>
              <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                <Activity className="h-5 w-5 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-slate-200 relative overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">Fallbacks Used</p>
                <div className="flex items-center gap-2">
                  <p className="text-4xl font-black text-slate-900">{fallbackCount}</p>
                </div>
              </div>
              <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                <AlertTriangle className={`h-5 w-5 ${fallbackCount === 0 ? 'text-slate-400' : 'text-amber-500'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="rounded-xl shadow-sm border-slate-200 col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold tracking-widest text-slate-500 uppercase">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#1e293b', fontWeight: '500' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-slate-700">{goodCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium text-slate-700">{warnCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-slate-700">{poorCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-slate-200 col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold tracking-widest text-slate-500 uppercase">Page Health Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pageHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="health" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results (Multi-Page Analysis) */}
        <Card className="rounded-xl shadow-sm border-slate-200 mb-8 overflow-hidden">
          <div className="p-5 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">Multi-Page Analysis</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="h-9 p-1 bg-slate-100 rounded-lg w-full">
                  <TabsTrigger value="mobile" className="text-xs h-7 rounded-md px-4 font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm">
                    <Smartphone className="h-3.5 w-3.5 mr-1.5" /> Mobile
                  </TabsTrigger>
                  <TabsTrigger value="desktop" className="text-xs h-7 rounded-md px-4 font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm">
                    <Monitor className="h-3.5 w-3.5 mr-1.5" /> Desktop
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input
                    placeholder="Filter by page..."
                    className="pl-9 h-9 text-sm border-slate-200 bg-slate-50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="h-9 w-9 bg-white shrink-0 border-slate-200 text-slate-500">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="p-0 bg-white">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="py-4 font-semibold text-slate-600">Page</TableHead>
                    <TableHead className="font-semibold text-slate-600">LCP</TableHead>
                    <TableHead className="font-semibold text-slate-600">INP</TableHead>
                    <TableHead className="font-semibold text-slate-600">CLS</TableHead>
                    <TableHead className="font-semibold text-slate-600">FCP</TableHead>
                    <TableHead className="font-semibold text-slate-600">TTFB</TableHead>
                    <TableHead className="font-semibold text-slate-600">Source</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map(page => {
                    const pageMetrics = metrics.filter(
                      m => m.pageId === page.pageId && m.device === activeTab
                    );
                    const source = pageMetrics[0]?.sourceUsed === 'pagespeed' ? 'PageSpeed' : 'Lighthouse';
                    const hasFB = pageMetrics.some(m => m.fallbackTriggered);

                    const lcp = pageMetrics.find(m => m.metricName === 'LCP');
                    const inp = pageMetrics.find(m => m.metricName === 'INP');
                    const cls = pageMetrics.find(m => m.metricName === 'CLS');
                    const fcp = pageMetrics.find(m => m.metricName === 'FCP');
                    const ttfb = pageMetrics.find(m => m.metricName === 'TTFB');

                    // Get comparison deltas for this page
                    const pageComparison = getPageComparisonData(page.pageId, activeTab as Device);

                    const MetricCell = ({ metric }: { metric?: typeof lcp }) => {
                      if (!metric) return <span className="text-slate-300">-</span>;

                      const metricComparison = pageComparison?.find(d => d.metricName === metric.metricName);
                      const hasComparison = metricComparison && metricComparison.deltaDirection !== 'unchanged';

                      return (
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${getStatusColor(metric.status)}`}>
                            {formatMetricValue(metric.value, metric.metricName)}
                          </span>
                          {hasComparison && (
                            <span className={cn(
                              "text-xs",
                              metricComparison.deltaDirection === 'improved' ? 'text-green-600' : 'text-red-600'
                            )}>
                              {metricComparison.deltaDirection === 'improved' ? '↓' : '↑'}
                            </span>
                          )}
                        </div>
                      );
                    };

                    return (
                      <TableRow key={page.pageId} className="border-b border-slate-100 transition-colors hover:bg-slate-50 group">
                        <TableCell className="font-medium text-slate-900 py-4">
                          {page.pageLabel}
                        </TableCell>
                        <TableCell><MetricCell metric={lcp} /></TableCell>
                        <TableCell><MetricCell metric={inp} /></TableCell>
                        <TableCell><MetricCell metric={cls} /></TableCell>
                        <TableCell><MetricCell metric={fcp} /></TableCell>
                        <TableCell><MetricCell metric={ttfb} /></TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {source} {hasFB && <Badge variant="outline" className="ml-1 text-[10px] leading-tight px-1 py-0 border-amber-200 text-amber-600 bg-amber-50">FB</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-blue-600 font-semibold group-hover:bg-blue-50"
                            onClick={() => {
                              setWorkspacePage(page.pageId);
                              setWorkspaceDevice(activeTab as 'mobile' | 'desktop');
                              const workspaceElement = document.getElementById('diagnostic-workspace');
                              if (workspaceElement) {
                                workspaceElement.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredPages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        No pages match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* DIAGNOSTIC WORKSPACE */}
        <div id="diagnostic-workspace" className="mb-12">
          {/* Workspace Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Page Diagnostics
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none ml-2 rounded-sm tracking-widest text-[10px] uppercase">
                  Detailed Analysis
                </Badge>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Page Selector */}
              <div className="flex items-center text-sm">
                <span className="text-slate-500 mr-2">Page:</span>
                <Select value={workspacePage} onValueChange={setWorkspacePage}>
                  <SelectTrigger className="h-9 w-[200px] border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((p) => (
                      <SelectItem key={p.pageId} value={p.pageId}>
                        <div className="flex items-center">
                          <span className="truncate">{p.pageLabel}</span>
                          <span className="text-xs text-slate-400 ml-2">({p.pageType})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Device Toggle */}
              <Tabs value={workspaceDevice} onValueChange={(v) => setWorkspaceDevice(v as 'mobile' | 'desktop')}>
                <TabsList className="h-9 p-1 bg-slate-200/50 rounded-md">
                  <TabsTrigger value="mobile" className="text-xs h-7 rounded-sm px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Smartphone className="h-3.5 w-3.5 mr-1.5" /> Mobile
                  </TabsTrigger>
                  <TabsTrigger value="desktop" className="text-xs h-7 rounded-sm px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Monitor className="h-3.5 w-3.5 mr-1.5" /> Desktop
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Source Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase tracking-wider",
                  actSourceUsed === 'pagespeed' && !actFallbackTriggered
                    ? "border-blue-200 text-blue-700 bg-blue-50"
                    : "border-amber-200 text-amber-700 bg-amber-50"
                )}
              >
                {actSourceUsed === 'pagespeed' && !actFallbackTriggered ? 'PageSpeed' : 'Lighthouse FB'}
              </Badge>
            </div>
          </div>

          {/* Page URL Display */}
          <div className="mb-6 p-3 bg-slate-100 rounded-lg flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600 font-mono truncate">{actPage?.url}</span>
            <a
              href={actPage?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-blue-600 hover:text-blue-700 text-xs flex items-center shrink-0"
            >
              Open <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </a>
          </div>

          {/* Core Web Vitals Assessment */}
          <div className="mb-6">
            <CWVAssessmentCard
              assessment={actCWVAssessment}
              pageLabel={actPage?.pageLabel || ''}
              device={workspaceDevice}
              source={actSourceUsed}
              fallbackTriggered={actFallbackTriggered}
              fallbackReason={actFallbackReason}
            />
          </div>

          {/* Category Scores */}
          <div className="mb-6">
            <CategoryScoreCards
              scores={actCategoryScores}
              device={workspaceDevice}
              onCategoryClick={(cat) => setWorkspaceCategory(cat as CategoryName)}
              activeCategory={workspaceCategory}
              baselineScores={baselineCategoryScores}
            />
          </div>

          {/* Category Tabs for Diagnostics */}
          <Tabs value={workspaceCategory} onValueChange={(v) => setWorkspaceCategory(v as CategoryName)}>
            <TabsList className="w-full justify-start mb-4 bg-white border border-slate-200 p-1 rounded-lg">
              <TabsTrigger value="performance" className="flex-1 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Zap className="h-3.5 w-3.5 mr-1.5" /> Performance
              </TabsTrigger>
              <TabsTrigger value="accessibility" className="flex-1 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Accessibility
              </TabsTrigger>
              <TabsTrigger value="best-practices" className="flex-1 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Best Practices
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex-1 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Search className="h-3.5 w-3.5 mr-1.5" /> SEO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="mt-0">
              <DiagnosticsPanel
                diagnostics={diagnostics}
                category="performance"
                device={workspaceDevice}
                pageLabel={actPage?.pageLabel || ''}
                pageId={actPage?.pageId || ''}
              />
            </TabsContent>

            <TabsContent value="accessibility" className="mt-0">
              <DiagnosticsPanel
                diagnostics={diagnostics}
                category="accessibility"
                device={workspaceDevice}
                pageLabel={actPage?.pageLabel || ''}
                pageId={actPage?.pageId || ''}
              />
            </TabsContent>

            <TabsContent value="best-practices" className="mt-0">
              <DiagnosticsPanel
                diagnostics={diagnostics}
                category="best-practices"
                device={workspaceDevice}
                pageLabel={actPage?.pageLabel || ''}
                pageId={actPage?.pageId || ''}
              />
            </TabsContent>

            <TabsContent value="seo" className="mt-0">
              <DiagnosticsPanel
                diagnostics={diagnostics}
                category="seo"
                device={workspaceDevice}
                pageLabel={actPage?.pageLabel || ''}
                pageId={actPage?.pageId || ''}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom Audit Metadata */}
        <Card className="mt-8 rounded-xl bg-slate-100/50 border-slate-200/60 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold tracking-widest text-slate-500 uppercase">Audit System Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Run ID</p>
                <p className="font-mono text-slate-700 font-medium">{run.runId.substring(0, 12)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Schema Version</p>
                <p className="text-slate-700 font-medium font-mono">{run.schemaVersion}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Generated Timestamp</p>
                <p className="text-slate-700 font-medium">{formatDate(run.generatedAt)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Deployment Tag</p>
                <p className="text-slate-700 font-medium font-mono bg-white px-2 py-0.5 rounded text-xs w-max border border-slate-200">{run.deploymentTag || 'N/A'}</p>
              </div>
            </div>

            {/* Category Scores Summary */}
            {categoryScores.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-3">Category Scores Collected</p>
                <div className="flex flex-wrap gap-2">
                  {['performance', 'accessibility', 'best-practices', 'seo'].map(cat => {
                    const catScores = categoryScores.filter(cs => cs.category === cat);
                    return (
                      <Badge key={cat} variant="outline" className="bg-white">
                        {cat}: {catScores.length} scores
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Diagnostics Summary */}
            {diagnostics.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-3">Diagnostic Items Collected</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white">
                    Total: {diagnostics.length}
                  </Badge>
                  <Badge variant="outline" className="bg-white text-red-600">
                    Failed: {diagnostics.filter(d => d.status === 'fail').length}
                  </Badge>
                  <Badge variant="outline" className="bg-white text-amber-600">
                    Warnings: {diagnostics.filter(d => d.status === 'warning').length}
                  </Badge>
                  <Badge variant="outline" className="bg-white text-green-600">
                    Passed: {diagnostics.filter(d => d.status === 'pass').length}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
