'use client';

/**
 * useDiagnosticWorkspace — state management for the per-page diagnostic workspace.
 * Extracted from results/page.tsx.
 */

import { useState, useMemo } from 'react';
import { AuditPage, MetricResult, CategoryScore, DiagnosticItem, CWVAssessment } from '@/types';
import { CategoryName } from '@/types';

interface UseDiagnosticWorkspaceProps {
  pages: AuditPage[];
  metrics: MetricResult[];
  categoryScores: CategoryScore[];
  diagnostics: DiagnosticItem[];
  cwvAssessments: CWVAssessment[];
}

export function useDiagnosticWorkspace({
  pages,
  metrics,
  categoryScores,
  diagnostics,
  cwvAssessments
}: UseDiagnosticWorkspaceProps) {
  const [workspacePage, setWorkspacePage] = useState<string>(pages[0]?.pageId ?? '');
  const [workspaceDevice, setWorkspaceDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [workspaceCategory, setWorkspaceCategory] = useState<CategoryName>('performance');

  const actPage = useMemo(
    () => pages.find(p => p.pageId === workspacePage) ?? pages[0],
    [pages, workspacePage]
  );

  const actMetrics = useMemo(
    () => metrics.filter(m => m.pageId === (actPage?.pageId) && m.device === workspaceDevice),
    [metrics, actPage, workspaceDevice]
  );

  const actCategoryScores = useMemo(
    () => categoryScores.filter(s => s.pageId === (actPage?.pageId) && s.device === workspaceDevice),
    [categoryScores, actPage, workspaceDevice]
  );

  const actCWVAssessment = useMemo(
    () => cwvAssessments.find(a => a.pageId === (actPage?.pageId) && a.device === workspaceDevice),
    [cwvAssessments, actPage, workspaceDevice]
  );

  const actSourceUsed = actMetrics[0]?.sourceUsed ?? 'pagespeed';
  const actFallbackTriggered = actMetrics.some(m => m.fallbackTriggered);
  const actFallbackReason = actMetrics.find(m => m.fallbackReason)?.fallbackReason;

  // Initialize workspacePage to first page if it hasn't been set yet
  if (!workspacePage && pages.length > 0) {
    setWorkspacePage(pages[0].pageId);
  }

  return {
    workspacePage,
    setWorkspacePage,
    workspaceDevice,
    setWorkspaceDevice,
    workspaceCategory,
    setWorkspaceCategory,
    actPage: actPage ?? null,
    actMetrics,
    actCategoryScores,
    actCWVAssessment: actCWVAssessment ?? null,
    actSourceUsed,
    actFallbackTriggered,
    actFallbackReason,
    diagnostics  // exposed for easy access in workspace (filtered by category in DiagnosticsPanel)
  };
}
