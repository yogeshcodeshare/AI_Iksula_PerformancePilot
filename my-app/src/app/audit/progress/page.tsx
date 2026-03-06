'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { runAudit } from '@/services/audit';
import { saveAuditState } from '@/services/storage';
import { AuditFormData, AuditState, MetricResult } from '@/types';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Smartphone,
  Monitor,
  ArrowRight,
  RotateCcw,
  RefreshCcw,
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface PageProgress {
  pageLabel: string;
  url: string;
  mobile: 'pending' | 'running' | 'completed' | 'failed';
  desktop: 'pending' | 'running' | 'completed' | 'failed';
  metrics: MetricResult[];
}

export default function AuditProgressPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AuditFormData | null>(null);
  const [pageProgress, setPageProgress] = useState<PageProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [status, setStatus] = useState<'running' | 'completed' | 'failed'>('running');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('audit-form-data');
    if (!stored) {
      router.push('/audit');
      return;
    }

    const data = JSON.parse(stored) as AuditFormData;
    setFormData(data);

    const initialProgress = data.pages.map(page => ({
      pageLabel: page.pageLabel,
      url: page.url,
      mobile: 'pending' as const,
      desktop: 'pending' as const,
      metrics: []
    }));
    setPageProgress(initialProgress);

    runAuditProcess(data, initialProgress);
  }, [router]);

  const runAuditProcess = async (
    data: AuditFormData,
    initialProgress: PageProgress[]
  ) => {
    try {
      const { run, pages, metrics } = await runAudit(data, (progress) => {
        const percent = (progress.completed / progress.total) * 100;
        setOverallProgress(percent);

        if (progress.currentPage) {
          setPageProgress(prev => {
            const updated = [...prev];
            const pageIndex = updated.findIndex(p => p.pageLabel === progress.currentPage);
            if (pageIndex >= 0) {
              if (progress.currentDevice === 'mobile') {
                updated[pageIndex].mobile = 'running';
              } else {
                updated[pageIndex].desktop = 'running';
                updated[pageIndex].mobile = 'completed';
              }
            }
            return updated;
          });
        }
      });

      setPageProgress(prev => prev.map(p => ({
        ...p,
        mobile: 'completed',
        desktop: 'completed'
      })));

      const state: AuditState = {
        run,
        pages,
        metrics,
        status: 'completed',
        progress: { total: pages.length * 2, completed: pages.length * 2 }
      };

      saveAuditState(state);
      setStatus('completed');
      setOverallProgress(100);

      sessionStorage.setItem('current-audit-state', JSON.stringify(state));
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const handleRetry = () => {
    if (formData) {
      setStatus('running');
      setError(null);
      setOverallProgress(0);
      const initialProgress = formData.pages.map(page => ({
        pageLabel: page.pageLabel,
        url: page.url,
        mobile: 'pending' as const,
        desktop: 'pending' as const,
        metrics: []
      }));
      setPageProgress(initialProgress);
      runAuditProcess(formData, initialProgress);
    }
  };

  if (!formData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] pb-24">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Audit in Progress</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <p className="text-slate-500 font-medium">Analyzing project performance metrics...</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{Math.round(overallProgress)}%</h2>
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mt-1">Total Completion</p>
          </div>
        </div>

        <Progress value={overallProgress} className="h-4 bg-slate-200 mb-8 rounded-full [&>div]:bg-slate-900" />
        <Card className="mb-8 rounded-xl shadow-sm border-slate-200 overflow-hidden">
          <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-start">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <RefreshCcw className={`w-5 h-5 text-slate-600 ${status === 'running' ? 'animate-spin-slow' : ''}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Audit Pipeline Status</h3>
                <p className="text-sm text-slate-500 mt-0.5">Real-time updates from internal test environments</p>
              </div>
            </div>
            <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-xs font-mono font-medium border border-slate-200">
              Session ID: PP-{Math.floor(Math.random() * 900) + 100}-XJ
            </div>
          </div>
          <CardContent className="p-0 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Page Label</th>
                    <th className="px-6 py-4 font-semibold">Target URL</th>
                    <th className="px-6 py-4 font-semibold text-center w-24">Mobile</th>
                    <th className="px-6 py-4 font-semibold text-center w-24">Desktop</th>
                    <th className="px-6 py-4 font-semibold text-right">Overall Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageProgress.map((page, index) => {
                    const isQueued = page.mobile === 'pending' && page.desktop === 'pending';
                    const isRunning = page.mobile === 'running' || page.desktop === 'running' || (page.mobile === 'completed' && page.desktop === 'pending');
                    const isFailed = page.mobile === 'failed' || page.desktop === 'failed';
                    const isCompleted = page.mobile === 'completed' && page.desktop === 'completed';

                    return (
                      <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{page.pageLabel}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{page.url}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center justify-center relative">
                            <Smartphone className={`w-4 h-4 ${page.mobile === 'pending' ? 'text-slate-300' : 'text-slate-600'}`} />
                            {page.mobile === 'running' && <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-blue-500"></span>}
                            {page.mobile === 'failed' && <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-red-500"></span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center justify-center relative">
                            <Monitor className={`w-4 h-4 ${page.desktop === 'pending' ? 'text-slate-300' : 'text-slate-600'}`} />
                            {page.desktop === 'running' && <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-blue-500"></span>}
                            {page.desktop === 'failed' && <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-red-500"></span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isQueued && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-3.5 h-3.5 mr-1" /> Queued
                            </span>
                          )}
                          {isRunning && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Running
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Success
                            </span>
                          )}
                          {isFailed && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center text-xs font-medium text-slate-500">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> PSI Engine Active</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Lighthouse Fallback Enabled</span>
              </div>
              <div>
                {status === 'running' ? 'Estimated remaining time: ~45s' : 'Audit Complete'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="rounded-xl bg-slate-50/50 border-slate-200/60 shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <Smartphone className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Mobile Emulation</h4>
                <p className="text-xs text-slate-500 mt-0.5">Moto G Power (3G) • 400x800</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-slate-50/50 border-slate-200/60 shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <Monitor className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Desktop Emulation</h4>
                <p className="text-xs text-slate-500 mt-0.5">Full HD • Broadband (Fiber)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-slate-50/50 border-slate-200/60 shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <CheckCircle className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Audit Protocol</h4>
                <p className="text-xs text-slate-500 mt-0.5">W3C Performance API • PSI v10.2</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky Bottom Feedback Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-6xl mx-auto flex items-center justify-end gap-6">
            {status === 'running' ? (
              <>
                <span className="text-sm italic text-slate-400 tracking-wide">Finalizing diagnostics... please do not close this window.</span>
                <Button disabled className="bg-slate-100 text-slate-500 border border-slate-200 h-12 px-8 rounded-md font-semibold">
                  Awaiting Completion...
                </Button>
              </>
            ) : status === 'failed' ? (
              <>
                <span className="text-sm font-semibold text-red-600 tracking-wide">{error}</span>
                <Button onClick={handleRetry} className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-8 rounded-md font-semibold">
                  <RotateCcw className="h-4 w-4 mr-2" /> Retry
                </Button>
              </>
            ) : (
              <Link href="/results">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-8 rounded-md font-semibold shadow-md">
                  View Results
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
