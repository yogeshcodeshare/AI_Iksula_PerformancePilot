'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuditState } from '@/hooks/useAuditState';
import { useResultsFilters } from '@/hooks/useResultsFilters';
import { useDiagnosticWorkspace } from '@/hooks/useDiagnosticWorkspace';
import { generateReportPackage, downloadJSON, downloadPDF, downloadPackage } from '@/services/export';
import { getBaselineReport, clearBaselineReport } from '@/services/storage';
import { compareReports } from '@/services/comparison';
import { Activity, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Device, ReportPackage } from '@/types';

// Refactored Components
import { AuditHeader } from '@/components/results/AuditHeader';
import { SummaryCards } from '@/components/results/SummaryCards';
import { ExecutiveSummaryCard } from '@/components/results/ExecutiveSummaryCard';
import { ResultsChartsSection } from '@/components/results/ResultsChartsSection';
import { MetricsMatrix } from '@/components/results/MetricsMatrix';
import { DiagnosticWorkspace } from '@/components/results/DiagnosticWorkspace';
import { AuditMetadata } from '@/components/results/AuditMetadata';
import { ComparisonDialog } from '@/components/results/ComparisonDialog';

function ResultsContent() {
  const searchParams = useSearchParams();
  const runId = searchParams.get('runId');
  
  const { state: auditState, isLoading, error } = useAuditState(runId);
  const [baselineReport, setBaselineReport] = useState<ReportPackage | null>(null);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);

  // Initialize filters once audit state is loaded
  const {
      searchQuery,
      setSearchQuery,
      statusFilter,
      setStatusFilter,
      showFilterMenu,
      setShowFilterMenu,
      filteredPages
  } = useResultsFilters({
    pages: auditState?.pages || [],
    metrics: auditState?.metrics || []
  });

  // Initialize workspace
  const workspace = useDiagnosticWorkspace({
    pages: auditState?.pages || [],
    metrics: auditState?.metrics || [],
    categoryScores: auditState?.categoryScores || [],
    diagnostics: auditState?.diagnostics || [],
    cwvAssessments: auditState?.cwvAssessments || []
  });

  useEffect(() => {
    const baseline = getBaselineReport();
    if (baseline) setBaselineReport(baseline);
  }, []);

  const comparison = useMemo(() => {
    if (!auditState || !auditState.run || !baselineReport) return null;
    const currentPkg = generateReportPackage(
      auditState.run,
      auditState.pages,
      auditState.metrics,
      auditState.categoryScores || [],
      auditState.diagnostics || [],
      auditState.cwvAssessments || []
    );
    return compareReports(baselineReport, currentPkg);
  }, [auditState, baselineReport]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-500">Loading audit results...</p>
        </div>
      </div>
    );
  }

  if (error || !auditState || !auditState.run) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-2">No audit data found</p>
          <p className="text-slate-500 text-sm mb-6">
            We couldn't find the audit run you were looking for. Please try running a new audit.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/audit"><Button>Start New Audit</Button></Link>
            <Link href="/"><Button variant="outline">Go Home</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const handleDownloadJSON = () => {
    const pkg = generateReportPackage(auditState.run!, auditState.pages, auditState.metrics, auditState.categoryScores!, auditState.diagnostics!, auditState.cwvAssessments!);
    downloadJSON(pkg);
  };

  const handleDownloadPDF = () => {
    const pkg = generateReportPackage(auditState.run!, auditState.pages, auditState.metrics, auditState.categoryScores!, auditState.diagnostics!, auditState.cwvAssessments!);
    downloadPDF(pkg);
  };

  const handleDownloadPackage = async () => {
    const pkg = generateReportPackage(auditState.run!, auditState.pages, auditState.metrics, auditState.categoryScores!, auditState.diagnostics!, auditState.cwvAssessments!);
    await downloadPackage(pkg);
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] pb-24">
      <AuditHeader 
        run={auditState.run}
        onDownloadJSON={handleDownloadJSON}
        onDownloadPDF={handleDownloadPDF}
        onDownloadPackage={handleDownloadPackage}
        onOpenComparison={() => setComparisonDialogOpen(true)}
        baselineProjectName={baselineReport?.auditRun.projectName}
        onClearBaseline={() => {
          clearBaselineReport();
          setBaselineReport(null);
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <SummaryCards 
            metrics={auditState.metrics} 
            pageCount={auditState.pages.length} 
        />

        <ExecutiveSummaryCard 
          pages={auditState.pages}
          metrics={auditState.metrics}
          cwvAssessments={auditState.cwvAssessments!}
          isPartial={auditState.status === 'partial'}
          pageFailures={auditState.pageFailures}
          retryAttempt={auditState.retryAttempt}
        />

        <ResultsChartsSection 
            metrics={auditState.metrics} 
            pages={auditState.pages} 
        />

        <MetricsMatrix 
            pages={auditState.pages}
            metrics={auditState.metrics}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            showFilterMenu={showFilterMenu}
            setShowFilterMenu={setShowFilterMenu}
            onViewDetails={(id, dev) => {
                workspace.setWorkspacePage(id);
                workspace.setWorkspaceDevice(dev);
                // Scroll to workspace logic here? Or just focus?
                const el = document.getElementById('diagnostic-workspace');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
        />

        <div id="diagnostic-workspace">
          <DiagnosticWorkspace 
            pages={auditState.pages}
            metrics={auditState.metrics}
            categoryScores={auditState.categoryScores!}
            diagnostics={auditState.diagnostics!}
            cwvAssessments={auditState.cwvAssessments!}
            workspacePage={workspace.workspacePage}
            setWorkspacePage={workspace.setWorkspacePage}
            workspaceDevice={workspace.workspaceDevice}
            setWorkspaceDevice={workspace.setWorkspaceDevice}
            workspaceCategory={workspace.workspaceCategory}
            setWorkspaceCategory={workspace.setWorkspaceCategory}
            actPage={workspace.actPage}
            actMetrics={workspace.actMetrics}
            actCategoryScores={workspace.actCategoryScores}
            actCWVAssessment={workspace.actCWVAssessment}
            actSourceUsed={workspace.actSourceUsed}
            actFallbackTriggered={workspace.actFallbackTriggered}
            actFallbackReason={workspace.actFallbackReason}
            baselineCategoryScores={
              baselineReport?.categoryScores?.filter(cs => {
                const bPage = baselineReport?.pages.find(p => p.pageId === cs.pageId);
                return bPage && bPage.url === workspace.actPage?.url && cs.device === workspace.workspaceDevice;
              }) || []
            }
          />
        </div>

        <AuditMetadata run={auditState.run} />

        <ComparisonDialog 
            open={comparisonDialogOpen}
            onOpenChange={setComparisonDialogOpen}
            onBaselineLoaded={setBaselineReport}
        />
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Activity className="h-12 w-12 text-slate-300 animate-pulse" />
        </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
