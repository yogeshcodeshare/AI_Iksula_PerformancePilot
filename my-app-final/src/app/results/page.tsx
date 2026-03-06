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
import { AuditState, MetricResult, Device } from '@/types';
import { generateReportPackage, downloadJSON, downloadPDF, downloadPackage } from '@/services/export';
import { getAuditState } from '@/services/storage';
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
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle
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
  Cell
} from 'recharts';

export default function ResultsPage() {
  const router = useRouter();
  const [auditState, setAuditState] = useState<AuditState | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Try to get from session first (for immediate results)
    const sessionData = sessionStorage.getItem('current-audit-state');
    if (sessionData) {
      setAuditState(JSON.parse(sessionData));
      return;
    }
    
    // Fallback to localStorage
    const stored = getAuditState();
    if (stored) {
      setAuditState(stored);
    } else {
      router.push('/');
    }
  }, [router]);

  if (!auditState || !auditState.run) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No audit results found</p>
          <Link href="/">
            <Button variant="outline" className="mt-4">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { run, pages, metrics } = auditState;
  
  // Calculate summary stats
  const goodCount = metrics.filter(m => m.status === 'good').length;
  const warnCount = metrics.filter(m => m.status === 'needs-improvement').length;
  const poorCount = metrics.filter(m => m.status === 'poor').length;
  const overallHealth = calculateOverallHealth(metrics);
  
  // Fallback tracking
  const fallbackCount = metrics.filter(m => m.fallbackTriggered).length;
  
  // Get metrics for a page/device
  const getPageMetrics = (pageId: string, device: Device): MetricResult[] => {
    return metrics.filter(m => m.pageId === pageId && m.device === device);
  };
  
  // Chart data
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
    const pkg = generateReportPackage(run, pages, metrics);
    downloadJSON(pkg);
  };

  const handleDownloadPDF = () => {
    const pkg = generateReportPackage(run, pages, metrics);
    downloadPDF(pkg);
  };

  const handleDownloadPackage = async () => {
    const pkg = generateReportPackage(run, pages, metrics);
    await downloadPackage(pkg);
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
                <h1 className="text-2xl font-bold text-slate-900">Audit Results</h1>
                <p className="text-sm text-slate-500">
                  {run.projectName} • {run.auditLabel}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadJSON}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button onClick={handleDownloadPackage}>
                <Package className="h-4 w-4 mr-2" />
                Package
              </Button>
            </div>
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
                  <p className="text-sm font-medium text-slate-500">Overall Health</p>
                  <p className={`text-3xl font-bold ${overallHealth >= 70 ? 'text-green-600' : overallHealth >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {overallHealth}%
                  </p>
                </div>
                <TrendingUp className={`h-8 w-8 ${overallHealth >= 70 ? 'text-green-500' : overallHealth >= 50 ? 'text-yellow-500' : 'text-red-500'}`} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pages Audited</p>
                  <p className="text-3xl font-bold text-slate-900">{pages.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Metrics Collected</p>
                  <p className="text-3xl font-bold text-slate-900">{metrics.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Fallbacks Used</p>
                  <p className={`text-3xl font-bold ${fallbackCount === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {fallbackCount}
                  </p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${fallbackCount === 0 ? 'text-green-500' : 'text-yellow-500'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-600">Good ({goodCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-slate-600">Needs Improvement ({warnCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-slate-600">Poor ({poorCount})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Page Health Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pageHealthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="health" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Results</CardTitle>
            <CardDescription>
              All metrics by page and device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
                <TabsTrigger value="desktop">Desktop</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead>LCP (M)</TableHead>
                        <TableHead>LCP (D)</TableHead>
                        <TableHead>INP (M)</TableHead>
                        <TableHead>INP (D)</TableHead>
                        <TableHead>CLS (M)</TableHead>
                        <TableHead>CLS (D)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.map(page => {
                        const mobileMetrics = getPageMetrics(page.pageId, 'mobile');
                        const desktopMetrics = getPageMetrics(page.pageId, 'desktop');
                        
                        const getMetric = (metrics: MetricResult[], name: string) => 
                          metrics.find(m => m.metricName === name);
                        
                        return (
                          <TableRow key={page.pageId}>
                            <TableCell className="font-medium">{page.pageLabel}</TableCell>
                            <TableCell>
                              {formatMetricValue(
                                getMetric(mobileMetrics, 'LCP')?.value || 0, 
                                'LCP'
                              )}
                            </TableCell>
                            <TableCell>
                              {formatMetricValue(
                                getMetric(desktopMetrics, 'LCP')?.value || 0, 
                                'LCP'
                              )}
                            </TableCell>
                            <TableCell>
                              {formatMetricValue(
                                getMetric(mobileMetrics, 'INP')?.value || 0, 
                                'INP'
                              )}
                            </TableCell>
                            <TableCell>
                              {formatMetricValue(
                                getMetric(desktopMetrics, 'INP')?.value || 0, 
                                'INP'
                              )}
                            </TableCell>
                            <TableCell>
                              {formatMetricValue(
                                getMetric(mobileMetrics, 'CLS')?.value || 0, 
                                'CLS'
                              )}
                            </TableCell>
                            <TableCell>
                              {formatMetricValue(
                                getMetric(desktopMetrics, 'CLS')?.value || 0, 
                                'CLS'
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="mobile">
                <DetailedMetricsTable pages={pages} metrics={metrics} device="mobile" />
              </TabsContent>
              
              <TabsContent value="desktop">
                <DetailedMetricsTable pages={pages} metrics={metrics} device="desktop" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Audit Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Run ID</p>
                <p className="font-mono text-slate-900">{run.runId.substring(0, 8)}...</p>
              </div>
              <div>
                <p className="text-slate-500">Schema Version</p>
                <p className="text-slate-900">{run.schemaVersion}</p>
              </div>
              <div>
                <p className="text-slate-500">Generated At</p>
                <p className="text-slate-900">{formatDate(run.generatedAt)}</p>
              </div>
              <div>
                <p className="text-slate-500">Environment</p>
                <p className="text-slate-900 capitalize">{run.environment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function DetailedMetricsTable({ 
  pages, 
  metrics, 
  device 
}: { 
  pages: AuditState['pages']; 
  metrics: MetricResult[]; 
  device: Device;
}) {
  const metricNames: MetricResult['metricName'][] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
  
  return (
    <ScrollArea className="h-96">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page</TableHead>
            {metricNames.map(name => (
              <TableHead key={name}>{name}</TableHead>
            ))}
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map(page => {
            const pageMetrics = metrics.filter(
              m => m.pageId === page.pageId && m.device === device
            );
            
            return (
              <TableRow key={page.pageId}>
                <TableCell className="font-medium">{page.pageLabel}</TableCell>
                {metricNames.map(name => {
                  const metric = pageMetrics.find(m => m.metricName === name);
                  return (
                    <TableCell key={name}>
                      {metric ? (
                        <div className="flex items-center gap-2">
                          <span className={getStatusColor(metric.status)}>
                            {formatMetricValue(metric.value, name)}
                          </span>
                          {metric.fallbackTriggered && (
                            <Badge variant="outline" className="text-xs">FB</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell>
                  {pageMetrics[0]?.sourceUsed === 'pagespeed' ? 'PageSpeed' : 'Lighthouse'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
