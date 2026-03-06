'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuditState } from '@/types';
import { getRecentAudits, importReportPackage } from '@/services/storage';
import { formatDate, calculateOverallHealth } from '@/lib/utils';
import { FileText, Plus, Upload, Activity, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [recentAudits, setRecentAudits] = useState<AuditState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const audits = getRecentAudits();
    setRecentAudits(audits);
    setIsLoading(false);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const reportPackage = importReportPackage(content);

      if (reportPackage) {
        // Store in session storage for comparison page
        sessionStorage.setItem('uploaded-baseline', JSON.stringify(reportPackage));
        router.push('/compare');
      } else {
        alert('Invalid report file. Please upload a valid JSON report package.');
      }
    };
    reader.readAsText(file);
  };

  const getQuickStats = () => {
    if (recentAudits.length === 0) return null;

    const completed = recentAudits.filter(a => a.status === 'completed').length;
    const totalPages = recentAudits.reduce((sum, a) => sum + a.pages.length, 0);

    return { completed, totalPages, totalAudits: recentAudits.length };
  };

  const stats = getQuickStats();

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Performance Overview</h1>
            <p className="text-slate-500 mt-1">Monitor and manage your website performance audits.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search audits..."
                className="pl-10 pr-4 py-2 border rounded-md text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Button variant="outline" className="text-slate-700 bg-white">Export Data</Button>
          </div>
        </div>
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-xl shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-2">Total Audits</p>
                    <p className="text-4xl font-bold text-slate-900">{stats.totalAudits.toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                    <FileText className="h-6 w-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-2">Pages Audited</p>
                    <p className="text-4xl font-bold text-slate-900">{stats.totalPages.toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                    <Activity className="h-6 w-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-2">Success Rate</p>
                    <p className="text-4xl font-bold text-slate-900">
                      {Math.round((stats.completed / (stats.totalAudits || 1)) * 100)}%
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                    <AlertCircle className="h-6 w-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="rounded-xl shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-md flex items-center justify-center mb-2">
                <Plus className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">New Audit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-8 min-h-[40px]">
                Configure a multi-page performance run. Supports project parameters, deployment environments, and custom mobile/desktop device profiles.
              </p>
              <Link href="/audit" className="block">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-md h-12">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Audit
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-md flex items-center justify-center mb-2">
                <Upload className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Compare Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4 min-h-[40px]">
                Analyze deltas between two specific audit reports. Upload previous JSON reports to identify regressions or performance improvements.
              </p>
              <div className="relative border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors py-8 text-center">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <p className="text-sm text-slate-400 mb-4">Drag and drop report.json here</p>
                <div className="flex justify-center">
                  <Button variant="outline" className="bg-white pointer-events-none">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Previous Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Audits */}
        <Card className="rounded-xl shadow-sm border-slate-200">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Recent Audit Activity</h2>
            <Button variant="ghost" className="text-sm text-slate-500 hover:text-slate-900">
              View All Activity <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : recentAudits.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No recent audits found</p>
                <p className="text-sm text-slate-400">Create a new audit to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Audit Name</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Page Count</th>
                      <th className="px-6 py-4 font-medium">Timestamp</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAudits.map((audit) => (
                      <tr key={audit.run?.runId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{audit.run?.projectName || 'Unnamed Audit'}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {audit.run?.runId.substring(0, 5).toUpperCase()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                            ${audit.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                              audit.status === 'failed' ? 'bg-red-100 text-red-800 border border-red-200' :
                                'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                            {audit.status === 'completed' ? 'Success' : audit.status === 'failed' ? 'Failed' : 'Warnings'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {audit.pages.length}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {audit.run?.generatedAt && formatDate(audit.run.generatedAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href="/results">
                            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                              <FileText className="h-4 w-4 mr-2" />
                              View Results
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <span>&copy; 2026 PerformancePilot. All rights reserved.</span>
            <span className="flex items-center text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
              System Status: Optimal
            </span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-900">Docs</Link>
            <Link href="#" className="hover:text-slate-900">Privacy</Link>
            <Link href="#" className="hover:text-slate-900">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
