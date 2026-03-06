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
import { FileText, Plus, Upload, Activity, TrendingUp, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">AI Performance Audit Agent</h1>
                <p className="text-sm text-slate-500">Automated website performance auditing</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/settings">
                <Button variant="outline">Settings</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Audits</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalAudits}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pages Audited</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalPages}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Completed</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.completed}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Audit
              </CardTitle>
              <CardDescription>
                Start a new performance audit for any website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Run comprehensive performance audits using PageSpeed Insights with Lighthouse fallback.
                Supports multiple pages, mobile and desktop testing.
              </p>
              <Link href="/audit">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Audit
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Compare Runs
              </CardTitle>
              <CardDescription>
                Upload a previous report to compare against
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Compare current performance against a baseline. Upload a previous report.json
                to see deltas, regressions, and improvements.
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Previous Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Audits */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Audits</CardTitle>
            <CardDescription>Your recently completed audits</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-slate-500">Loading...</p>
            ) : recentAudits.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No recent audits found</p>
                <p className="text-sm text-slate-400">Create a new audit to get started</p>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {recentAudits.map((audit) => (
                    <div
                      key={audit.run?.runId}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {audit.run?.projectName}
                          </p>
                          <Badge variant={audit.status === 'completed' ? 'default' : 'secondary'}>
                            {audit.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          {audit.run?.auditLabel} • {audit.pages.length} pages
                        </p>
                        <p className="text-xs text-slate-400">
                          {audit.run?.generatedAt && formatDate(audit.run.generatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href="/results">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
