'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { runAudit, retryFailedItems, FullAuditResult, PageDeviceStatus, MAX_RETRY_ATTEMPTS } from '@/services/audit';
import { saveAuditStateAsync } from '@/services/storage';
import { AuditFormData, AuditState, MetricResult, CategoryScore, DiagnosticItem, CWVAssessment, Device } from '@/types';
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
  Activity,
  BarChart3,
  FileSearch,
  Timer,
  WifiOff
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

function StatusIcon({ status }: { status: PageDeviceStatus }) {
  if (status === 'running') return <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />;
  if (status === 'completed') return <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />;
  if (status === 'failed') return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />;
  if (status === 'timeout') return <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />;
  if (status === 'retrying') return <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />; // pending
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

  if (queued) return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      <Clock className="w-3.5 h-3.5 mr-1" /> Queued
    </span>
  );

  if (retrying) return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
      <RotateCcw className="w-3.5 h-3.5 mr-1 animate-spin" /> Retrying
    </span>
  );

  if (running) return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Running
    </span>
  );

  if (timedOut && !failed) return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
      <Timer className="w-3.5 h-3.5 mr-1" /> Timeout
    </span>
  );

  if (failed || timedOut) {
    const isRateLimit = mobileErrorCode === 'rate-limit' || desktopErrorCode === 'rate-limit';
    const isNetwork = mobileErrorCode === 'network' || desktopErrorCode === 'network';
    if (isRateLimit) return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Rate Limited
      </span>
    );
    if (isNetwork) return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <WifiOff className="w-3.5 h-3.5 mr-1" /> Network Error
      </span>
    );
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-3.5 h-3.5 mr-1" /> Failed
      </span>
    );
  }

  if (completed) return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Success
    </span>
  );

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

  // We keep a ref to the last saved AuditState so retryFailedItems can merge against it
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
    // Await the async save so IndexedDB write completes before "View Results" is enabled
    await saveAuditStateAsync(state);
    lastSavedStateRef.current = state;
    try {
      sessionStorage.setItem('current-audit-state', JSON.stringify(state));
    } catch {
      console.warn('Session storage full — results will load from IndexedDB');
    }
    // Set the full runId AFTER save is confirmed so the link only becomes active once data is ready
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

  /** Retry only failed items, preserving all successful results */
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

    // Mark failed pages as 'retrying' in progress UI
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

  /** Hard retry — re-runs the full audit from scratch */
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const canRetryFailed = failureCount > 0 && retryAttempt < MAX_RETRY_ATTEMPTS && !isRetrying;
  const retriesExhausted = failureCount > 0 && retryAttempt >= MAX_RETRY_ATTEMPTS;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] pb-24">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Audit in Progress</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <p className="text-slate-500 font-medium">
                {status === 'running'
                  ? isRetrying
                    ? `Retry attempt ${retryAttempt} of ${MAX_RETRY_ATTEMPTS} — only retrying failed items...`
                    : 'Collecting PageSpeed Insights data with full diagnostics...'
                  : status === 'completed'
                    ? failureCount > 0
                      ? `Audit complete with ${failureCount} page-device ${failureCount === 1 ? 'result' : 'results'} still unavailable`
                      : retryAttempt > 0
                        ? `All items recovered after ${retryAttempt} retry attempt${retryAttempt > 1 ? 's' : ''} ✓`
                        : 'All pages audited successfully'
                    : 'Audit encountered an error'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{Math.round(overallProgress)}%</h2>
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mt-1">Total Completion</p>
          </div>
        </div>

        <Progress value={overallProgress} className="h-4 bg-slate-200 mb-8 rounded-full [&>div]:bg-slate-900" />

        {/* Retry Attribution Banner */}
        {isRetrying && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
            <RotateCcw className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0 animate-spin" />
            <div>
              <p className="text-purple-800 font-semibold text-sm">
                Retry attempt {retryAttempt}/{MAX_RETRY_ATTEMPTS} — retrying {failureCount} failed item{failureCount !== 1 ? 's' : ''} only
              </p>
              <p className="text-purple-700 text-xs mt-1">
                All previously successful results are preserved. Only the failed page-device combos are being re-audited.
              </p>
            </div>
          </div>
        )}

        {/* Failure Banner */}
        {status === 'completed' && failureCount > 0 && !isRetrying && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-800 font-semibold text-sm">
                {failureCount} page-device {failureCount === 1 ? 'result' : 'results'} could not be retrieved
              </p>
              <p className="text-amber-700 text-xs mt-1">
                All successful results are preserved. {retriesExhausted
                  ? `Maximum retries (${MAX_RETRY_ATTEMPTS}) reached.`
                  : `You can retry failed items (attempt ${retryAttempt + 1} of ${MAX_RETRY_ATTEMPTS}).`}
              </p>
            </div>
          </div>
        )}

        {/* Retries exhausted notice */}
        {retriesExhausted && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-semibold text-sm">Maximum retries exhausted</p>
              <p className="text-red-700 text-xs mt-1">
                {failureCount} item{failureCount !== 1 ? 's' : ''} could not be recovered after {MAX_RETRY_ATTEMPTS} attempts.
                These may be due to API rate limits or the page being unreachable.
                You can still view and export the results for successfully audited pages.
              </p>
            </div>
          </div>
        )}

        {/* Data Collection Stats */}
        {status === 'completed' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 flex items-center gap-3">
                <Activity className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium uppercase">Metrics Collected</p>
                  <p className="text-xl font-bold text-blue-900">{stats.metricsCollected}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-emerald-600 font-medium uppercase">Category Scores</p>
                  <p className="text-xl font-bold text-emerald-900">{stats.categoryScoresCollected}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 flex items-center gap-3">
                <FileSearch className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs text-amber-600 font-medium uppercase">Diagnostic Items</p>
                  <p className="text-xl font-bold text-amber-900">{stats.diagnosticsCollected}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="mb-8 rounded-xl shadow-sm border-slate-200 overflow-hidden">
          <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-start">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <RefreshCcw className={`w-5 h-5 text-slate-600 ${status === 'running' ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Audit Pipeline Status</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {status === 'running'
                    ? isRetrying ? 'Retrying only the failed page-device combos...' : 'Collecting PageSpeed Insights data with full diagnostics...'
                    : status === 'completed'
                      ? 'Audit complete with category scores and diagnostic details'
                      : 'Audit failed — see error details below'}
                </p>
              </div>
            </div>
            <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-xs font-mono font-medium border border-slate-200">
              Run ID: {runId}
            </div>
          </div>
          <CardContent className="p-0 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Page Label</th>
                    <th className="px-6 py-4 font-semibold">Target URL</th>
                    <th className="px-6 py-4 font-semibold text-center w-28">Mobile</th>
                    <th className="px-6 py-4 font-semibold text-center w-28">Desktop</th>
                    <th className="px-6 py-4 font-semibold text-right">Overall Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageProgress.map((page, index) => (
                    <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{page.pageLabel}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs max-w-xs truncate">{page.url}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 justify-center">
                          <Smartphone className={`w-4 h-4 ${page.mobile === 'pending' ? 'text-slate-300' : 'text-slate-600'}`} />
                          <StatusIcon status={page.mobile} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 justify-center">
                          <Monitor className={`w-4 h-4 ${page.desktop === 'pending' ? 'text-slate-300' : 'text-slate-600'}`} />
                          <StatusIcon status={page.desktop} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <RowStatusBadge
                          mobile={page.mobile}
                          desktop={page.desktop}
                          mobileErrorCode={page.mobileErrorCode}
                          desktopErrorCode={page.desktopErrorCode}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center text-xs font-medium text-slate-500">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Running</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Completed</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Failed</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Timeout</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Retrying</span>
              </div>
              <div>
                {status === 'running' ? 'Collecting full diagnostic data...' : status === 'completed' ? 'Audit Complete' : 'Audit Failed'}
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
                <p className="text-xs text-slate-500 mt-0.5">Moto G Power (3G) · 400×800</p>
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
                <p className="text-xs text-slate-500 mt-0.5">Full HD · Broadband (Fiber)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-slate-50/50 border-slate-200/60 shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <Activity className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Audit Protocol</h4>
                <p className="text-xs text-slate-500 mt-0.5">Core Web Vitals · PSI v5 · 65s timeout</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky Bottom Feedback Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-6xl mx-auto flex items-center justify-end gap-4">
            {status === 'running' ? (
              <>
                <span className="text-sm italic text-slate-400 tracking-wide">
                  {isRetrying ? `Retrying failed items (attempt ${retryAttempt}/${MAX_RETRY_ATTEMPTS})...` : 'Collecting diagnostics... do not close this window.'}
                </span>
                <Button disabled className="bg-slate-100 text-slate-500 border border-slate-200 h-12 px-8 rounded-md font-semibold">
                  Awaiting Completion...
                </Button>
              </>
            ) : status === 'failed' ? (
              <>
                <span className="text-sm font-semibold text-red-600 tracking-wide">{error}</span>
                <Button onClick={handleFullRetry} className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-8 rounded-md font-semibold">
                  <RotateCcw className="h-4 w-4 mr-2" /> Retry Full Audit
                </Button>
              </>
            ) : (
              <>
                {canRetryFailed && (
                  <Button
                    onClick={handleRetryFailed}
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 h-12 px-6 rounded-md font-semibold"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry {failureCount} Failed Item{failureCount !== 1 ? 's' : ''}
                    <span className="ml-2 text-xs opacity-70">({retryAttempt}/{MAX_RETRY_ATTEMPTS} used)</span>
                  </Button>
                )}
                {retriesExhausted && (
                  <Button onClick={handleFullRetry} variant="outline" className="border-slate-300 text-slate-600 h-12 px-6">
                    <RotateCcw className="h-4 w-4 mr-2" /> Full Re-run
                  </Button>
                )}
                {isSaving ? (
                  <Button disabled className="bg-slate-400 text-white h-12 px-8 rounded-md font-semibold cursor-not-allowed">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Results...
                  </Button>
                ) : savedRunId ? (
                  <Link href={`/results?runId=${savedRunId}`}>
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-8 rounded-md font-semibold shadow-md">
                      View Results
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                ) : null}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
