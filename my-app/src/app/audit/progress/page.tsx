'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { runAudit, retryFailedItems, FullAuditResult, PageDeviceStatus, MAX_RETRY_ATTEMPTS, getPageConcurrency } from '@/services/audit';
import { saveAuditStateAsync } from '@/services/storage';
import { AuditFormData, AuditState, MetricResult, CategoryScore, DiagnosticItem, CWVAssessment } from '@/types';
import {
  Loader2,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface PageProgress {
  pageLabel: string;
  url: string;
  mobile: PageDeviceStatus;
  desktop: PageDeviceStatus;
  mobileErrorCode?: string;
  desktopErrorCode?: string;
  mobileErrorMessage?: string;
  desktopErrorMessage?: string;
  metrics: MetricResult[];
  categoryScores: CategoryScore[];
  diagnostics: DiagnosticItem[];
  cwvAssessment?: CWVAssessment;
}

function StatusCell({ status }: { status: PageDeviceStatus }) {
  if (status === 'running') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--blue-text)' }}>
      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Running
    </span>
  );
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--green-text)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      Done
    </span>
  );
  if (status === 'failed' || status === 'timeout') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--red-text)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      {status === 'timeout' ? 'Timeout' : 'Failed'}
    </span>
  );
  if (status === 'retrying') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--purple-text)' }}>
      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Retrying
    </span>
  );
  // pending/queued
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="w-2 h-2 rounded-full bg-border" />
      Queued
    </span>
  );
}

function RowStatusBadge({ mobile, desktop, mobileErrorCode, desktopErrorCode }: {
  mobile: PageDeviceStatus;
  desktop: PageDeviceStatus;
  mobileErrorCode?: string;
  desktopErrorCode?: string;
}) {
  const failed = mobile === 'failed' || desktop === 'failed';
  const timedOut = mobile === 'timeout' || desktop === 'timeout';
  const retrying = mobile === 'retrying' || desktop === 'retrying';
  const completed = mobile === 'completed' && desktop === 'completed';
  const running = mobile === 'running' || desktop === 'running' || (mobile === 'completed' && desktop === 'pending');
  const queued = mobile === 'pending' && desktop === 'pending';

  if (queued) return <span className="status-badge text-muted-foreground" style={{ background: 'var(--background)' }}>Pending</span>;
  if (retrying) return <span className="status-badge" style={{ background: 'var(--purple-bg)', color: 'var(--purple-text)' }}><span className="pulse-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--purple-text)' }} />Retrying</span>;
  if (running) return <span className="status-badge" style={{ background: 'var(--blue-bg)', color: 'var(--blue-text)' }}><span className="pulse-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--blue-text)' }} />In Progress</span>;

  if (failed || timedOut) {
    const isRateLimit = mobileErrorCode === 'rate-limit' || desktopErrorCode === 'rate-limit';
    if (isRateLimit) return <span className="status-badge" style={{ background: 'var(--amber-bg)', color: 'var(--amber-text)' }}>Rate Limited</span>;
    return <span className="status-badge" style={{ background: 'var(--red-bg)', color: 'var(--red-text)' }}>Failed</span>;
  }

  if (completed) return <span className="status-badge" style={{ background: 'var(--green-bg)', color: 'var(--green-text)' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green-text)' }} />Success</span>;
  return null;
}

export default function AuditProgressPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AuditFormData | null>(null);
  const [pageProgress, setPageProgress] = useState<PageProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [status, setStatus] = useState<'running' | 'completed' | 'failed'>('running');
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string>('—');
  const [savedRunId, setSavedRunId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [stats, setStats] = useState({
    metricsCollected: 0,
    categoryScoresCollected: 0,
    diagnosticsCollected: 0
  });

  const lastSavedStateRef = useRef<AuditState | null>(null);

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
      mobile: 'pending' as PageDeviceStatus,
      desktop: 'pending' as PageDeviceStatus,
      metrics: [],
      categoryScores: [],
      diagnostics: []
    }));
    setPageProgress(initialProgress);

    runAuditProcess(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildAndSaveState = async (result: FullAuditResult, attempt: number): Promise<AuditState> => {
    const state: AuditState = {
      run: result.run,
      pages: result.pages,
      metrics: result.metrics,
      categoryScores: result.categoryScores,
      diagnostics: result.diagnostics,
      cwvAssessments: result.cwvAssessments,
      status: (result.pageFailures?.length ?? 0) > 0 ? 'partial' : 'completed',
      progress: { total: result.pages.length * 2, completed: result.pages.length * 2 },
      pageFailures: result.pageFailures,
      retryAttempt: attempt
    };
    await saveAuditStateAsync(state);
    lastSavedStateRef.current = state;
    try {
      sessionStorage.setItem('current-audit-state', JSON.stringify(state));
    } catch {
      console.warn('Session storage full — results will load from IndexedDB');
    }
    setSavedRunId(result.run.runId);
    return state;
  };

  const runAuditProcess = async (data: AuditFormData) => {
    try {
      const result: FullAuditResult = await runAudit(data, (progress) => {
        const percent = (progress.completed / progress.total) * 100;
        setOverallProgress(percent);

        if (progress.pageUpdate) {
          const { pageLabel, device, status: deviceStatus, errorCode, errorMessage } = progress.pageUpdate;
          setPageProgress(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(p => p.pageLabel === pageLabel);
            if (idx >= 0) {
              if (device === 'mobile') {
                updated[idx].mobile = deviceStatus;
                if (errorCode) updated[idx].mobileErrorCode = errorCode;
                if (errorMessage) updated[idx].mobileErrorMessage = errorMessage;
              } else {
                updated[idx].desktop = deviceStatus;
                if (errorCode) updated[idx].desktopErrorCode = errorCode;
                if (errorMessage) updated[idx].desktopErrorMessage = errorMessage;
              }
            }
            return updated;
          });
        }
      });

      setRunId(result.run.runId.substring(0, 8).toUpperCase());
      const failCount = result.pageFailures?.length ?? 0;
      setFailureCount(failCount);
      setOverallProgress(100);
      setStats({
        metricsCollected: result.metrics.length,
        categoryScoresCollected: result.categoryScores.length,
        diagnosticsCollected: result.diagnostics.length
      });
      setIsSaving(true);
      await buildAndSaveState(result, 0);
      setIsSaving(false);
      setStatus('completed');
    } catch (err) {
      console.error('Audit process failed:', err);
      setIsSaving(false);
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const handleRetryFailed = async () => {
    const prev = lastSavedStateRef.current;
    if (!prev) return;

    const nextAttempt = retryAttempt + 1;
    if (nextAttempt > MAX_RETRY_ATTEMPTS) {
      alert(`Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Some pages may be unavailable.`);
      return;
    }

    setIsRetrying(true);
    setRetryAttempt(nextAttempt);
    setStatus('running');
    setError(null);
    setOverallProgress(0);

    const failedLabels = new Set((prev.pageFailures ?? []).map(f => f.pageLabel));
    const failedDevices = new Map((prev.pageFailures ?? []).map(f => [`${f.pageLabel}:${f.device}`, true]));
    setPageProgress(current => current.map(p => {
      if (!failedLabels.has(p.pageLabel)) return p;
      return {
        ...p,
        mobile: failedDevices.has(`${p.pageLabel}:mobile`) ? ('retrying' as PageDeviceStatus) : p.mobile,
        desktop: failedDevices.has(`${p.pageLabel}:desktop`) ? ('retrying' as PageDeviceStatus) : p.desktop,
        mobileErrorCode: undefined,
        desktopErrorCode: undefined,
      };
    }));

    try {
      const result = await retryFailedItems(prev, (progress) => {
        if (progress.pageUpdate) {
          const { pageLabel, device, status: deviceStatus, errorCode, errorMessage } = progress.pageUpdate;
          setPageProgress(curr => {
            const updated = [...curr];
            const idx = updated.findIndex(p => p.pageLabel === pageLabel);
            if (idx >= 0) {
              if (device === 'mobile') {
                updated[idx].mobile = deviceStatus;
                if (errorCode) updated[idx].mobileErrorCode = errorCode;
                if (errorMessage) updated[idx].mobileErrorMessage = errorMessage;
              } else {
                updated[idx].desktop = deviceStatus;
                if (errorCode) updated[idx].desktopErrorCode = errorCode;
                if (errorMessage) updated[idx].desktopErrorMessage = errorMessage;
              }
            }
            return updated;
          });
        }
      });

      const failCount = result.pageFailures?.length ?? 0;
      setFailureCount(failCount);
      setOverallProgress(100);
      setStats({
        metricsCollected: result.metrics.length,
        categoryScoresCollected: result.categoryScores.length,
        diagnosticsCollected: result.diagnostics.length
      });
      setIsSaving(true);
      await buildAndSaveState(result, nextAttempt);
      setIsSaving(false);
      setStatus('completed');
    } catch (err) {
      setIsSaving(false);
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleFullRetry = () => {
    if (formData) {
      setStatus('running');
      setError(null);
      setOverallProgress(0);
      setRunId('—');
      setFailureCount(0);
      setRetryAttempt(0);
      setIsRetrying(false);
      lastSavedStateRef.current = null;
      const initialProgress = formData.pages.map(page => ({
        pageLabel: page.pageLabel,
        url: page.url,
        mobile: 'pending' as PageDeviceStatus,
        desktop: 'pending' as PageDeviceStatus,
        metrics: [],
        categoryScores: [],
        diagnostics: []
      }));
      setPageProgress(initialProgress);
      runAuditProcess(formData);
    }
  };

  if (!formData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  const canRetryFailed = failureCount > 0 && retryAttempt < MAX_RETRY_ATTEMPTS && !isRetrying;
  const retriesExhausted = failureCount > 0 && retryAttempt >= MAX_RETRY_ATTEMPTS;
  const completedTasks = pageProgress.reduce((n, p) => n + (p.mobile === 'completed' ? 1 : 0) + (p.desktop === 'completed' ? 1 : 0), 0);
  const totalTasks = pageProgress.length * 2;

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)] pb-24">
      <main className="max-w-[1024px] mx-auto px-6 py-10">

        {/* Progress Hero — Centered */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            {status === 'running' ? (
              <>
                <span className="pulse-dot w-2.5 h-2.5 rounded-full" style={{ background: 'var(--blue-text)' }} />
                <span className="text-[13px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--blue-text)' }}>Running Audit</span>
              </>
            ) : status === 'completed' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: failureCount > 0 ? 'var(--amber-text)' : 'var(--green-text)' }} />
                <span className="text-[13px] font-semibold uppercase tracking-[0.1em]" style={{ color: failureCount > 0 ? 'var(--amber-text)' : 'var(--green-text)' }}>
                  {failureCount > 0 ? 'Completed with Warnings' : 'Audit Complete'}
                </span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--red-text)' }} />
                <span className="text-[13px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--red-text)' }}>Audit Failed</span>
              </>
            )}
          </div>
          <div className="count-up font-mono text-[52px] font-bold text-foreground tracking-[-0.04em]">{Math.round(overallProgress)}%</div>
          <p className="text-muted-foreground text-sm mt-2">
            {status === 'running'
              ? isRetrying
                ? `Retrying failed items (attempt ${retryAttempt}/${MAX_RETRY_ATTEMPTS})...`
                : 'Collecting PageSpeed Insights data...'
              : status === 'completed'
                ? failureCount > 0
                  ? `${failureCount} item${failureCount !== 1 ? 's' : ''} could not be retrieved`
                  : 'All pages audited successfully'
                : error || 'Unknown error'}
          </p>
          <div className="max-w-[480px] mx-auto mt-6 h-2 bg-background rounded-full overflow-hidden border border-border/50">
            <div className="h-full rounded-full progress-anim" style={{ width: `${overallProgress}%`, background: `linear-gradient(90deg, color-mix(in srgb, var(--blue-text) 60%, transparent), var(--blue-text))` }} />
          </div>
        </div>

        {/* Stats — Double Bezel */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="double-bezel">
            <div className="double-bezel-inner text-center !py-4 !px-6">
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: 'var(--blue-bg)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue-text)" strokeWidth={1.5}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div className="count-up font-mono text-[26px] font-bold text-foreground">{stats.metricsCollected}</div>
              <div className="text-muted-foreground text-xs mt-1">Metrics Collected</div>
            </div>
          </div>
          <div className="double-bezel">
            <div className="double-bezel-inner text-center !py-4 !px-6">
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: 'var(--green-bg)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth={1.5}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div className="count-up font-mono text-[26px] font-bold text-foreground">{stats.diagnosticsCollected}</div>
              <div className="text-muted-foreground text-xs mt-1">Diagnostics Found</div>
            </div>
          </div>
          <div className="double-bezel">
            <div className="double-bezel-inner text-center !py-4 !px-6">
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: 'var(--amber-bg)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber-text)" strokeWidth={1.5}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
              </div>
              <div className="count-up font-mono text-[26px] font-bold text-foreground">{stats.categoryScoresCollected}</div>
              <div className="text-muted-foreground text-xs mt-1">Categories Scored</div>
            </div>
          </div>
        </div>

        {/* Pipeline Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <h2 className="text-[16px] font-bold text-foreground tracking-normal">Audit Pipeline Status</h2>
            <span className="font-mono text-muted-foreground text-[11px] bg-background px-2.5 py-1 rounded-md">Run: {runId}</span>
          </div>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-5 py-2.5 text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.08em]">Page</th>
                <th className="text-left px-5 py-2.5 text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.08em]">URL</th>
                <th className="text-center px-5 py-2.5 text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.08em]">Mobile</th>
                <th className="text-center px-5 py-2.5 text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.08em]">Desktop</th>
                <th className="text-center px-5 py-2.5 text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.08em]">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageProgress.map((page, index) => (
                <tr key={index} className="table-row-hover border-b border-border/30 last:border-0">
                  <td className="px-5 py-3.5 font-medium text-foreground">{page.pageLabel}</td>
                  <td className="px-5 py-3.5 font-mono text-muted-foreground text-xs max-w-[200px] truncate">
                    {page.url.replace(/^https?:\/\//, '').split('/').slice(0, 2).join('/')}
                  </td>
                  <td className="px-5 py-3.5 text-center"><StatusCell status={page.mobile} /></td>
                  <td className="px-5 py-3.5 text-center"><StatusCell status={page.desktop} /></td>
                  <td className="px-5 py-3.5 text-center">
                    <RowStatusBadge mobile={page.mobile} desktop={page.desktop} mobileErrorCode={page.mobileErrorCode} desktopErrorCode={page.desktopErrorCode} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.08em] mb-3">Device Emulation</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Mobile</span><span className="text-foreground font-medium">Moto G Power (412 x 823)</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Desktop</span><span className="text-foreground font-medium">Full HD (1920 x 1080)</span></div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.08em] mb-3">Protocol</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Method</span><span className="text-foreground font-medium">B.L.A.S.T. v1.0</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pipeline</span><span className="text-foreground font-medium">{(() => { const c = getPageConcurrency(formData?.pages.length ?? 0); return c <= 1 ? 'Sequential (1 at a time)' : `Parallel (${c} at a time)`; })()}</span></div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t border-border" style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}>
        <div className="max-w-[1024px] mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            {status === 'running' && <span className="pulse-dot w-2 h-2 rounded-full" style={{ background: 'var(--blue-text)' }} />}
            <span className="text-muted-foreground text-sm">
              {status === 'running'
                ? `Audit in progress — ${completedTasks} of ${totalTasks} tasks completed`
                : status === 'completed'
                  ? failureCount > 0 ? `Completed with ${failureCount} issue${failureCount !== 1 ? 's' : ''}` : 'Audit complete'
                  : 'Audit failed'}
            </span>
          </div>
          <div className="flex gap-3">
            {status === 'running' ? (
              <button className="px-4 py-2 text-[13px] font-medium border border-border rounded-[10px] bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
                Cancel Audit
              </button>
            ) : status === 'failed' ? (
              <Button onClick={handleFullRetry} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 rounded-[10px] font-medium">
                <RotateCcw className="h-4 w-4 mr-2" /> Retry Full Audit
              </Button>
            ) : (
              <>
                {canRetryFailed && (
                  <button
                    onClick={handleRetryFailed}
                    className="px-4 py-2 text-sm font-medium border rounded-[10px] cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--amber-text)', color: 'var(--amber-text)', background: 'transparent' }}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5 inline" />
                    Retry {failureCount} Failed
                  </button>
                )}
                {retriesExhausted && (
                  <Button onClick={handleFullRetry} variant="outline" className="border-border text-muted-foreground h-10 px-4 rounded-[10px]">
                    <RotateCcw className="h-4 w-4 mr-2" /> Full Re-run
                  </Button>
                )}
              </>
            )}
            {status === 'running' ? (
              <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-[10px] opacity-40 cursor-not-allowed border-none" disabled>
                View Results <ArrowRight className="h-4 w-4" />
              </button>
            ) : isSaving ? (
              <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-muted text-muted-foreground rounded-[10px] cursor-not-allowed border-none" disabled>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving Results...
              </button>
            ) : savedRunId ? (
              <Link href={`/results?runId=${savedRunId}`}>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-[10px] hover:opacity-85 transition-all cursor-pointer border-none">
                  View Results <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            ) : status === 'failed' ? null : (
              <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-[10px] opacity-40 cursor-not-allowed border-none" disabled>
                View Results <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
