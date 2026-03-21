// Storage service - localStorage persistence
import { AuditState, ReportPackage, ComparisonResult } from '@/types';

const STORAGE_KEY_CURRENT = 'ai-performance-audit-agent-current';
const STORAGE_KEY_RECENT = 'ai-performance-audit-agent-recent-audits';
const STORAGE_KEY_SETTINGS = 'ai-performance-audit-settings';
const STORAGE_KEY_COMPARISON = 'ai-performance-audit-agent-comparison';
const MAX_RECENT_AUDITS = 5;

import { dbSet, dbGet, dbRemove } from './db';

export interface AuditSettings {
  apiKey?: string;
  defaultEnvironment?: string;
  thresholds?: {
    LCP?: { good: number; warn: number };
    INP?: { good: number; warn: number };
    CLS?: { good: number; warn: number };
    FCP?: { good: number; warn: number };
    TTFB?: { good: number; warn: number };
  };
}

export interface RecentAudit {
  runId: string;
  projectName: string;
  auditLabel: string;
  environment: string;
  generatedAt: string;
  pageCount: number;
  metricCount: number;
  overallHealth: number;
}

export function saveAuditState(state: AuditState): void {
  if (typeof window === 'undefined') return;
  if (!state.run) return;

  const runId = state.run.runId;
  const storageKey = `audit-run-${runId}`;

  try {
    const json = JSON.stringify(state);
    // Continue saving to 'current' for backward compatibility and quick access
    localStorage.setItem(STORAGE_KEY_CURRENT, json);
    localStorage.setItem('ai-performance-audit-agent-last-run-id', runId);
    
    addToRecentAudits(state);

    // Save to IndexedDB with run-specific key
    dbSet(storageKey, state).catch(err => console.error('IndexedDB save failed:', err));
    // Also update 'current' for generic lookups
    dbSet(STORAGE_KEY_CURRENT, state).catch(err => console.error('IndexedDB save failed:', err));
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
      console.warn('LocalStorage quota exceeded, saving full version to IndexedDB...');

      // Save full version to IndexedDB (as primary fallback)
      dbSet(storageKey, state).catch(err => console.error('IndexedDB save failed:', err));
      dbSet(STORAGE_KEY_CURRENT, state).catch(err => console.error('IndexedDB save failed:', err));
      addToRecentAudits(state);
    } else {
      console.error('Failed to save audit state:', error);
    }
  }
}

/**
 * Async version of saveAuditState that uses IndexedDB (preferred for large reports)
 */
export async function saveAuditStateAsync(state: AuditState): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!state.run) return;

  const runId = state.run.runId;
  const storageKey = `audit-run-${runId}`;

  // Update recent audits list (small metadata)
  addToRecentAudits(state);

  // Save to IndexedDB (no 5MB limit) with run-specific key
  await dbSet(storageKey, state);
  // Also update 'current'
  await dbSet(STORAGE_KEY_CURRENT, state);
  
  // Update last run ID
  localStorage.setItem('ai-performance-audit-agent-last-run-id', runId);

  // Try to save light version to localStorage for quick dashboard previews
  try {
    const lightState = {
      ...state,
      diagnostics: state.diagnostics.map(d => ({ ...d, details: undefined }))
    };
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(lightState));
  } catch (e) {
    // Silent fail for localStorage
  }
}

export async function getAuditStateByRunId(runId: string): Promise<AuditState | null> {
  if (typeof window === 'undefined') return null;
  const storageKey = `audit-run-${runId}`;
  const state = await dbGet<AuditState>(storageKey);
  return state ? normalizeState(state) : null;
}

export function getLastRunId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ai-performance-audit-agent-last-run-id');
}

export function getAuditState(): AuditState | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (!data) return null;

    const state = JSON.parse(data) as AuditState;
    return normalizeState(state);
  } catch (error) {
    console.error('Failed to get audit state:', error);
    return null;
  }
}

/**
 * Async version of getAuditState that prioritizes IndexedDB
 */
export async function getAuditStateAsync(): Promise<AuditState | null> {
  if (typeof window === 'undefined') return null;

  try {
    // Try IndexedDB first (most complete data)
    const dbState = await dbGet<AuditState>(STORAGE_KEY_CURRENT);
    if (dbState) return normalizeState(dbState);

    // Fallback to localStorage
    return getAuditState();
  } catch (error) {
    console.error('Failed to get audit state async:', error);
    return getAuditState();
  }
}

function normalizeState(state: AuditState): AuditState {
  if (!state.categoryScores) state.categoryScores = [];
  if (!state.diagnostics) state.diagnostics = [];
  if (!state.cwvAssessments) state.cwvAssessments = [];
  if (!state.pageFailures) state.pageFailures = [];
  return state;
}

export function clearAuditState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_CURRENT);
}

export function saveSessionAuditState(state: AuditState): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem('current-audit-state', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save session audit state:', error);
  }
}

export function getSessionAuditState(): AuditState | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = sessionStorage.getItem('current-audit-state');
    if (!data) return null;

    const state = JSON.parse(data) as AuditState;

    // Ensure new fields exist (backward compatibility)
    if (!state.categoryScores) state.categoryScores = [];
    if (!state.diagnostics) state.diagnostics = [];
    if (!state.cwvAssessments) state.cwvAssessments = [];

    return state;
  } catch (error) {
    console.error('Failed to get session audit state:', error);
    return null;
  }
}

function addToRecentAudits(state: AuditState): void {
  if (!state.run) return;

  try {
    const recent = getRecentAudits();
    const { run, pages, metrics } = state;

    // Calculate overall health
    const goodCount = metrics.filter(m => m.status === 'good').length;
    const totalCount = metrics.length;
    const overallHealth = totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 0;

    const audit: RecentAudit = {
      runId: run.runId,
      projectName: run.projectName,
      auditLabel: run.auditLabel,
      environment: run.environment,
      generatedAt: run.generatedAt,
      pageCount: pages.length,
      metricCount: metrics.length,
      overallHealth
    };

    // Remove if exists
    const filtered = recent.filter(a => a.runId !== audit.runId);

    // Add to beginning
    filtered.unshift(audit);

    // Keep only max
    const trimmed = filtered.slice(0, MAX_RECENT_AUDITS);

    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to add to recent audits:', error);
  }
}

export function getRecentAudits(): RecentAudit[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY_RECENT);
    if (!data) return [];

    const parsed = JSON.parse(data) as RecentAudit[];

    // Filter out invalid entries and handle backward compatibility
    return parsed.filter(audit => {
      // Ensure required fields exist
      return audit && typeof audit === 'object';
    }).map(audit => ({
      runId: audit.runId || 'unknown',
      projectName: audit.projectName || 'Unnamed Audit',
      auditLabel: audit.auditLabel || '',
      environment: audit.environment || 'unknown',
      generatedAt: audit.generatedAt || new Date().toISOString(),
      pageCount: audit.pageCount || 0,
      metricCount: audit.metricCount || 0,
      overallHealth: audit.overallHealth || 0
    }));
  } catch (error) {
    console.error('Failed to get recent audits:', error);
    return [];
  }
}

export function deleteRecentAudit(runId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const recent = getRecentAudits().filter(a => a.runId !== runId);
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recent));
  } catch (error) {
    console.error('Failed to delete recent audit:', error);
  }
}

export function saveSettings(settings: AuditSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function getSettings(): AuditSettings {
  if (typeof window === 'undefined') return {};

  try {
    const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to get settings:', error);
    return {};
  }
}

// Save uploaded baseline report for comparison
export function saveBaselineReport(report: ReportPackage): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('ai-performance-audit-baseline', JSON.stringify(report));
  } catch (error) {
    console.error('Failed to save baseline report:', error);
  }
}

export function getBaselineReport(): ReportPackage | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem('ai-performance-audit-baseline');
    if (!data) return null;

    const report = JSON.parse(data) as ReportPackage;

    // Ensure new fields exist (backward compatibility)
    if (!report.categoryScores) report.categoryScores = [];
    if (!report.diagnostics) report.diagnostics = [];
    if (!report.cwvAssessments) report.cwvAssessments = [];

    return report;
  } catch (error) {
    console.error('Failed to get baseline report:', error);
    return null;
  }
}

export function clearBaselineReport(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ai-performance-audit-baseline');
}

// Save comparison result
export function saveComparisonResult(comparison: ComparisonResult): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY_COMPARISON, JSON.stringify(comparison));
  } catch (error) {
    console.error('Failed to save comparison result:', error);
  }
}

export function getComparisonResult(): ComparisonResult | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(STORAGE_KEY_COMPARISON);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get comparison result:', error);
    return null;
  }
}

export function clearComparisonResult(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_COMPARISON);
}

// Import report package from JSON string
export function importReportPackage(jsonString: string): ReportPackage | null {
  try {
    const parsed = JSON.parse(jsonString) as ReportPackage;

    // Validate required fields
    if (!parsed.auditRun || !parsed.pages || !parsed.metrics) {
      console.error('Invalid report package: missing required fields');
      return null;
    }

    // Ensure new fields exist for backward compatibility
    if (!parsed.categoryScores) parsed.categoryScores = [];
    if (!parsed.diagnostics) parsed.diagnostics = [];
    if (!parsed.cwvAssessments) parsed.cwvAssessments = [];

    return parsed;
  } catch (error) {
    console.error('Failed to import report package:', error);
    return null;
  }
}
