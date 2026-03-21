'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentAudit } from '@/services/storage';
import { getRecentAudits, importReportPackage } from '@/services/storage';
import { formatDate } from '@/lib/utils';
import { FileText, Plus, Upload, Activity, TrendingUp, AlertCircle, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleViewResults = async (targetRunId: string) => {
    router.push(`/results?runId=${targetRunId}`);
  };

  const filteredAudits = searchQuery.trim()
    ? recentAudits.filter(a =>
        a.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.auditLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.runId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentAudits;

  const stats = recentAudits.length > 0 ? {
    totalPages: recentAudits.reduce((sum, a) => sum + (a.pageCount || 0), 0),
    totalAudits: recentAudits.length
  } : null;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Performance Overview</h1>
            <p className="text-slate-500 mt-1">Monitor and manage your website performance audits.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search audits..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 w-56"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
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
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-2">Avg Health</p>
                    <p className="text-4xl font-bold text-slate-900">
                      {Math.round(recentAudits.reduce((sum, a) => sum + (a.overallHealth || 0), 0) / (recentAudits.length || 1))}%
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                    <TrendingUp className="h-6 w-6 text-slate-400" />
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
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                if (confirm('Clear all recent audit activity?')) {
                  localStorage.removeItem('ai-performance-audit-agent-recent-audits');
                  setRecentAudits([]);
                }
              }}
            >
              Clear All
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
                    {filteredAudits.map((audit, index) => (
                      <tr key={`audit-${index}-${audit.runId || 'unknown'}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{audit.projectName || 'Unnamed Audit'}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {audit.auditLabel ? `${audit.auditLabel} · ` : ''}ID: {audit.runId ? audit.runId.substring(0, 8).toUpperCase() : 'N/A'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                            ${(audit.overallHealth || 0) >= 80 ? 'bg-green-100 text-green-800 border border-green-200' :
                              (audit.overallHealth || 0) >= 50 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                'bg-red-100 text-red-800 border border-red-200'}`}>
                            {(audit.overallHealth || 0) >= 80 ? 'Good' : (audit.overallHealth || 0) >= 50 ? 'Fair' : 'Poor'} ({audit.overallHealth || 0}%)
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {audit.pageCount || 0}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {audit.generatedAt ? formatDate(audit.generatedAt) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            onClick={() => handleViewResults(audit.runId)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Results
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredAudits.length === 0 && searchQuery && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          No audits matching &ldquo;{searchQuery}&rdquo;
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-sm text-slate-400">
          <span>&copy; {new Date().getFullYear()} PerformancePilot &mdash; AI Performance Audit Agent</span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            PageSpeed Insights v5
          </span>
        </div>
      </footer>
    </div>
  );
}
