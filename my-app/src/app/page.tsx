'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RecentAudit } from '@/services/storage';
import { getRecentAudits, importReportPackage, saveBaselineReportAsync, getAuditStateByRunId } from '@/services/storage';
import { formatDate, calculateOverallHealth } from '@/lib/utils';
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

    // Recalculate health from IndexedDB to fix stale cached values
    (async () => {
      const updated = await Promise.all(
        audits.map(async (audit) => {
          try {
            const state = await getAuditStateByRunId(audit.runId);
            if (state?.metrics && state.metrics.length > 0) {
              return { ...audit, overallHealth: calculateOverallHealth(state.metrics) };
            }
          } catch { /* keep cached value */ }
          return audit;
        })
      );
      setRecentAudits(updated);
    })();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const reportPackage = importReportPackage(content);

      if (reportPackage) {
        try {
          await saveBaselineReportAsync(reportPackage);
          router.push('/compare');
        } catch {
          alert('Failed to save baseline report. The file may be too large.');
        }
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

  const stats = {
    totalAudits: recentAudits.length,
    totalPages: recentAudits.reduce((sum, a) => sum + (a.pageCount || 0), 0),
    avgHealth: recentAudits.length > 0
      ? Math.round(recentAudits.reduce((sum, a) => sum + (a.overallHealth || 0), 0) / recentAudits.length)
      : 0
  };

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-[34px] font-bold text-foreground tracking-[-0.03em] leading-tight">Performance Audits</h1>
            <p className="text-muted-foreground mt-1.5 text-base">Monitor and optimize your web performance metrics.</p>
          </div>
          <Link href="/audit">
            <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-[10px] text-[15px] font-medium hover:opacity-85 active:scale-[0.98] transition-all cursor-pointer border-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Audit
            </button>
          </Link>
        </div>

        {/* Stats Cards — Double Bezel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Total Audits */}
          <div className="double-bezel">
            <div className="double-bezel-inner">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.1em]">Total Audits</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--blue-bg)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue-text)" strokeWidth={1.5}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                </div>
              </div>
              <div className="count-up font-mono text-[40px] font-bold text-foreground tracking-[-0.03em]">{stats.totalAudits}</div>
              <div className="mt-3 h-1.5 bg-background rounded-full overflow-hidden">
                <div className="h-full rounded-full opacity-30" style={{ width: '60%', background: 'var(--blue-text)' }} />
              </div>
              <p className="text-[12px] mt-2" style={{ color: 'var(--ring)' }}>
                {recentAudits.length > 0 ? `${Math.min(recentAudits.length, 3)} this month` : 'No audits yet'}
              </p>
            </div>
          </div>

          {/* Avg Health Score */}
          <div className="double-bezel">
            <div className="double-bezel-inner">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.1em]">Avg Health Score</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--green-bg)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth={1.5}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
              </div>
              <div className="count-up font-mono text-[40px] font-bold tracking-[-0.03em]" style={{ color: 'var(--green-text)' }}>{stats.avgHealth}%</div>
              <div className="mt-3 h-1.5 bg-background rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${stats.avgHealth}%`, background: 'var(--green-bar)' }} />
              </div>
              <p className="text-[12px] mt-2" style={{ color: 'var(--ring)' }}>
                {recentAudits.length > 0 ? 'Across all audits' : 'No data yet'}
              </p>
            </div>
          </div>

          {/* Pages Tested */}
          <div className="double-bezel">
            <div className="double-bezel-inner">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.1em]">Pages Tested</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--amber-bg)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber-text)" strokeWidth={1.5}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </div>
              </div>
              <div className="count-up font-mono text-[40px] font-bold text-foreground tracking-[-0.03em]">{stats.totalPages}</div>
              <div className="mt-3 h-1.5 bg-background rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(stats.totalPages * 2, 100)}%`, background: 'var(--amber-bar)' }} />
              </div>
              <p className="text-[12px] mt-2" style={{ color: 'var(--ring)' }}>
                Across {stats.totalAudits} audit{stats.totalAudits !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          <Link href="/audit" className="no-underline">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-sm)] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-foreground)" strokeWidth={1.5}><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">Start New Audit</h3>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">Configure target URLs and run a fresh performance analysis with PageSpeed Insights.</p>
                  <span className="inline-flex items-center gap-1.5 text-foreground text-sm font-medium mt-3">
                    Configure Audit <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>

          <div className="relative bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-sm)] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-muted-foreground"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground">Compare Runs</h3>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">Upload a baseline report and compare against a recent audit to track deltas.</p>
                <span className="inline-flex items-center gap-1.5 text-foreground text-sm font-medium mt-3">
                  Upload Baseline <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Audits */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[22px] font-bold text-foreground tracking-[-0.02em]">Recent Audits</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--ring)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  placeholder="Search audits..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="py-2 pl-8 pr-3 w-[200px] text-sm bg-card border border-border rounded-lg text-foreground outline-none font-[inherit] placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                />
              </div>
              {recentAudits.length > 0 && (
                <button
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors"
                  style={{ color: 'var(--red-text)', background: 'var(--red-bg)' }}
                  onClick={() => {
                    if (confirm('Clear all recent audit activity?')) {
                      localStorage.removeItem('ai-performance-audit-agent-recent-audits');
                      setRecentAudits([]);
                    }
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : recentAudits.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto mb-3 text-muted-foreground/40" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-foreground font-medium">No recent audits found</p>
                <p className="text-sm text-muted-foreground">Create a new audit to get started</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.1em]">Project</th>
                    <th className="text-left px-5 py-3 text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.1em]">Label</th>
                    <th className="text-left px-5 py-3 text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.1em]">Health</th>
                    <th className="text-left px-5 py-3 text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.1em]">Pages</th>
                    <th className="text-left px-5 py-3 text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.1em]">Date</th>
                    <th className="text-right px-5 py-3 text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.1em]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudits.map((audit, index) => {
                    const health = audit.overallHealth || 0;
                    const colorBg = health >= 80 ? 'var(--green-bg)' : health >= 50 ? 'var(--amber-bg)' : 'var(--red-bg)';
                    const colorText = health >= 80 ? 'var(--green-text)' : health >= 50 ? 'var(--amber-text)' : 'var(--red-text)';
                    return (
                      <tr
                        key={`audit-${index}-${audit.runId || 'unknown'}`}
                        className="table-row-hover cursor-pointer border-b border-border/50 last:border-0"
                        onClick={() => handleViewResults(audit.runId)}
                      >
                        <td className="px-5 py-4 font-medium text-foreground">{audit.projectName || 'Unnamed Audit'}</td>
                        <td className="px-5 py-4 text-foreground/80">{audit.auditLabel || '—'}</td>
                        <td className="px-5 py-4">
                          <span className="status-badge" style={{ background: colorBg, color: colorText }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: colorText }} />
                            {health}%
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-muted-foreground text-xs">{audit.pageCount || 0} pages</td>
                        <td className="px-5 py-4 text-muted-foreground text-xs">{audit.generatedAt ? formatDate(audit.generatedAt) : 'N/A'}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            className="p-1.5 rounded-md border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); handleViewResults(audit.runId); }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAudits.length === 0 && searchQuery && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                        No audits matching &ldquo;{searchQuery}&rdquo;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs flex items-center justify-center gap-2" style={{ color: 'var(--ring)' }}>
          PerformancePilot v1.0 <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-emerald-500" />
            System Healthy
          </span>
        </div>
      </main>
    </div>
  );
}
