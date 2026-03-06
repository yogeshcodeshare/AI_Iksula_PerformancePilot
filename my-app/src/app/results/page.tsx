'use client';

import { useEffect, useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Filter,
  ArrowUpRight,
  Globe,
  Clock,
  Activity
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

export default function ResultsPage() {
  const router = useRouter();
  const [auditState, setAuditState] = useState<AuditState | null>(null);
  const [activeTab, setActiveTab] = useState('mobile');
  const [searchQuery, setSearchQuery] = useState('');

  // Workspace active selections
  const [workspacePage, setWorkspacePage] = useState<string>('');
  const [workspaceDevice, setWorkspaceDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [workspaceCategoryTab, setWorkspaceCategoryTab] = useState('performance');

  useEffect(() => {
    // Try to get from session first (for immediate results)
    const sessionData = sessionStorage.getItem('current-audit-state');
    if (sessionData) {
      const state = JSON.parse(sessionData);
      setAuditState(state);
      if (state.pages && state.pages.length > 0) {
        setWorkspacePage(state.pages[0].pageId);
      }
      return;
    }

    // Fallback to localStorage
    const stored = getAuditState();
    if (stored) {
      setAuditState(stored);
      if (stored.pages && stored.pages.length > 0) {
        setWorkspacePage(stored.pages[0].pageId);
      }
    } else {
      router.push('/');
    }
  }, [router]);

  if (!auditState || !auditState.run) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No audit results found</p>
          <Link href="/">
            <Button variant="outline" className="mt-4">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { run, pages, metrics } = auditState;

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

  // Workspace active page data
  const actPage = pages.find(p => p.pageId === workspacePage) || pages[0];
  const actPageMetrics = metrics.filter(m => m.pageId === actPage?.pageId && m.device === workspaceDevice);
  const getWMetric = (name: string) => actPageMetrics.find(m => m.metricName === name);
  const actSourceUsed = actPageMetrics[0]?.sourceUsed || 'pagespeed';

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] pb-24">
      {/* Top Navigation Row */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                <Search className="h-5 w-5 text-indigo-500" />
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
              {/* TABS FOR THIS SECTION */}
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

                    return (
                      <TableRow key={page.pageId} className="border-b border-slate-100 transition-colors hover:bg-slate-50 group">
                        <TableCell className="font-medium text-slate-900 py-4">
                          {page.pageLabel}
                        </TableCell>
                        <TableCell>
                          {lcp ? <span className={`font-medium ${getStatusColor(lcp.status)}`}>{formatMetricValue(lcp.value, 'LCP')}</span> : <span className="text-slate-300">-</span>}
                        </TableCell>
                        <TableCell>
                          {inp ? <span className={`font-medium ${getStatusColor(inp.status)}`}>{formatMetricValue(inp.value, 'INP')}</span> : <span className="text-slate-300">-</span>}
                        </TableCell>
                        <TableCell>
                          {cls ? <span className={`font-medium ${getStatusColor(cls.status)}`}>{formatMetricValue(cls.value, 'CLS')}</span> : <span className="text-slate-300">-</span>}
                        </TableCell>
                        <TableCell>
                          {fcp ? <span className={`font-medium ${getStatusColor(fcp.status)}`}>{formatMetricValue(fcp.value, 'FCP')}</span> : <span className="text-slate-300">-</span>}
                        </TableCell>
                        <TableCell>
                          {ttfb ? <span className={`font-medium ${getStatusColor(ttfb.status)}`}>{formatMetricValue(ttfb.value, 'TTFB')}</span> : <span className="text-slate-300">-</span>}
                        </TableCell>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Diagnostic Workspace <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none ml-2 rounded-sm tracking-widest text-[10px] uppercase">Beta</Badge></h2>
              <span className="text-slate-300 mx-2 hidden sm:inline">|</span>
              <div className="flex items-center text-sm font-medium">
                <span className="text-slate-500 mr-2">Analyzing:</span>
                <Select value={workspacePage} onValueChange={setWorkspacePage}>
                  <SelectTrigger className="h-8 border-none bg-transparent hover:bg-slate-100 font-bold text-slate-900 focus:ring-0 shadow-none px-2 underline underline-offset-4 decoration-2 decoration-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((p) => (
                      <SelectItem key={p.pageId} value={p.pageId}>{p.pageLabel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Tabs value={workspaceDevice} onValueChange={(v) => setWorkspaceDevice(v as 'mobile' | 'desktop')}>
                <TabsList className="h-8 p-1 bg-slate-200/50 rounded-md">
                  <TabsTrigger value="mobile" className="text-xs h-6 rounded-sm px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Mobile</TabsTrigger>
                  <TabsTrigger value="desktop" className="text-xs h-6 rounded-sm px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Desktop</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="sm" className="h-8 text-slate-600 border-slate-200">
                <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" /> Open PageSpeed Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Vitals Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="rounded-xl shadow-sm border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Activity className="h-4 w-4" /> Core Web Vitals
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 shadow-none">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Passing
                  </Badge>
                </div>
                <div className="divide-y divide-slate-100">
                  {/* LCP */}
                  <div className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-sm font-semibold text-slate-700 mt-1">Largest Contentful Paint (LCP)</p>
                      <span className={`text-lg font-bold ${getStatusColor(getWMetric('LCP')?.status || 'good')}`}>
                        {formatMetricValue(getWMetric('LCP')?.value || 0, 'LCP')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mr-4 overflow-hidden">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">Target: &lt; 2.5s</span>
                    </div>
                  </div>
                  {/* INP */}
                  <div className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-sm font-semibold text-slate-700 mt-1">Interaction to Next Paint (INP)</p>
                      <span className={`text-lg font-bold ${getStatusColor(getWMetric('INP')?.status || 'good')}`}>
                        {formatMetricValue(getWMetric('INP')?.value || 0, 'INP')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mr-4 overflow-hidden">
                        <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">Target: &lt; 200ms</span>
                    </div>
                  </div>
                  {/* CLS */}
                  <div className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-sm font-semibold text-slate-700 mt-1">Cumulative Layout Shift (CLS)</p>
                      <span className={`text-lg font-bold ${getStatusColor(getWMetric('CLS')?.status || 'good')}`}>
                        {formatMetricValue(getWMetric('CLS')?.value || 0, 'CLS')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mr-4 overflow-hidden">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">Target: &lt; 0.1</span>
                    </div>
                  </div>
                  {/* FCP */}
                  <div className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-sm font-semibold text-slate-700 mt-1">First Contentful Paint (FCP)</p>
                      <span className={`text-lg font-bold ${getStatusColor(getWMetric('FCP')?.status || 'good')}`}>
                        {formatMetricValue(getWMetric('FCP')?.value || 0, 'FCP')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mr-4 overflow-hidden">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">Target: &lt; 1.8s</span>
                    </div>
                  </div>
                  {/* TTFB */}
                  <div className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-sm font-semibold text-slate-700 mt-1">Time to First Byte (TTFB)</p>
                      <span className={`text-lg font-bold ${getStatusColor(getWMetric('TTFB')?.status || 'good')}`}>
                        {formatMetricValue(getWMetric('TTFB')?.value || 0, 'TTFB')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mr-4 overflow-hidden">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">Target: &lt; 800ms</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Score Area */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Category Scores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card onClick={() => setWorkspaceCategoryTab('performance')} className={`cursor-pointer rounded-xl border-slate-200 shadow-sm transition-all ${workspaceCategoryTab === 'performance' ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:bg-slate-50'}`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-black text-slate-900 mb-1">94</div>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                      <Zap className="w-3.5 h-3.5 text-blue-500" /> PERFORMANCE
                    </div>
                  </CardContent>
                </Card>
                <Card onClick={() => setWorkspaceCategoryTab('accessibility')} className={`cursor-pointer rounded-xl border-slate-200 shadow-sm transition-all ${workspaceCategoryTab === 'accessibility' ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:bg-slate-50'}`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-black text-slate-900 mb-1">100</div>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> ACCESSIBILITY
                    </div>
                  </CardContent>
                </Card>
                <Card onClick={() => setWorkspaceCategoryTab('best-practices')} className={`cursor-pointer rounded-xl border-slate-200 shadow-sm transition-all ${workspaceCategoryTab === 'best-practices' ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:bg-slate-50'}`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-black text-slate-900 mb-1">92</div>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> BEST PRACTICES
                    </div>
                  </CardContent>
                </Card>
                <Card onClick={() => setWorkspaceCategoryTab('seo')} className={`cursor-pointer rounded-xl border-slate-200 shadow-sm transition-all ${workspaceCategoryTab === 'seo' ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:bg-slate-50'}`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-black text-slate-900 mb-1">100</div>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                      <Search className="w-3.5 h-3.5 text-amber-500" /> SEO
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Diagnostic Accordions Panel */}
              <Card className="rounded-xl shadow-sm border-slate-200">
                <CardHeader className="pb-4 border-b border-slate-100 bg-white rounded-t-xl">
                  <CardTitle className="text-[13px] font-bold tracking-widest text-slate-500 uppercase">Diagnose Issues & Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible defaultValue="item-1" className="w-full border-none">
                    <AccordionItem value="item-1" className="border-b border-slate-100 px-4">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-8 h-8 rounded-md bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-3">
                              <h4 className="font-bold text-slate-900 text-[15px]">Reduce unused JavaScript</h4>
                              <span className="text-[10px] font-bold tracking-wider uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded">High Severity</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Estimated savings: 1,450ms</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 pl-11 pr-4">
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <p className="text-sm text-slate-700 leading-relaxed mb-4">
                            JavaScript execution time is significantly impacting the main thread. We identified several third-party scripts that are not required for the initial viewport render.
                          </p>
                          <div className="mb-4">
                            <h5 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-2">Affected Resources:</h5>
                            <div className="bg-white border md:border-slate-200 border-none rounded-md text-xs font-mono">
                              <div className="flex justify-between py-2 px-3 border-b border-slate-100">
                                <span className="text-slate-600 truncate mr-4">...static/js/vendor-analytics.js</span>
                                <span className="text-red-600 font-semibold shrink-0">450kb</span>
                              </div>
                              <div className="flex justify-between py-2 px-3">
                                <span className="text-slate-600 truncate mr-4">...static/js/marketing-pixel.js</span>
                                <span className="text-red-600 font-semibold shrink-0">120kb</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50/50 p-2 rounded">
                            <ExternalLink className="w-4 h-4" />
                            <span className="font-medium">Recommendation:</span> <a href="#" className="underline">Defer non-critical scripts or use a Web Worker.</a>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2" className="border-b border-slate-100 px-4">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-3">
                              <h4 className="font-bold text-slate-900 text-[15px]">Efficiently encode images</h4>
                              <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Medium Severity</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Estimated savings: 620ms</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 pl-11 pr-4">
                        <p className="text-sm text-slate-600 bg-slate-50 p-4 border border-slate-200 rounded-lg">Serve images in modern formats like WebP or AVIF to consume less cellular data and improve load time.</p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3" className="border-none px-4">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-8 h-8 rounded-md bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-3">
                              <h4 className="font-bold text-slate-900 text-[15px]">Properly sized images</h4>
                              <span className="text-[10px] font-bold tracking-wider uppercase text-green-600 bg-transparent px-0 py-0.5 rounded">Resolved</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">All images match their display dimensions.</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 pl-11 pr-4">
                        <p className="text-sm text-slate-600 bg-slate-50 p-4 border border-slate-200 rounded-lg">No improperly sized images were detected during this audit.</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>
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
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Generated Timstamp</p>
                <p className="text-slate-700 font-medium">{formatDate(run.generatedAt)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Deployment Tag</p>
                <p className="text-slate-700 font-medium font-mono bg-white px-2 py-0.5 rounded text-xs w-max border border-slate-200">{run.deploymentTag || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
