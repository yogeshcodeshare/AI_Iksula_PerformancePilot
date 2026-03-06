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
  RotateCcw
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Audit Progress</h1>
              <p className="text-sm text-slate-500">
                {formData.projectName} • {formData.auditLabel}
              </p>
            </div>
            <Badge 
              variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}
              className="text-sm"
            >
              {status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>
              {status === 'running' && 'Running performance audits...'}
              {status === 'completed' && 'All audits completed successfully!'}
              {status === 'failed' && 'Audit failed. See error below.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-3" />
            <p className="mt-2 text-sm text-slate-500 text-right">
              {Math.round(overallProgress)}% complete
            </p>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900">Audit Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={handleRetry}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Page Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {pageProgress.map((page, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{page.pageLabel}</p>
                        <span className="text-sm text-slate-400 truncate max-w-xs">
                          {page.url}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-slate-400" />
                        {page.mobile === 'pending' && (
                          <span className="text-sm text-slate-400">Pending</span>
                        )}
                        {page.mobile === 'running' && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                        {page.mobile === 'completed' && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {page.mobile === 'failed' && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-slate-400" />
                        {page.desktop === 'pending' && (
                          <span className="text-sm text-slate-400">Pending</span>
                        )}
                        {page.desktop === 'running' && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                        {page.desktop === 'completed' && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {page.desktop === 'failed' && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {status === 'completed' && (
          <div className="mt-6 flex justify-end">
            <Link href="/results">
              <Button size="lg">
                View Results
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
