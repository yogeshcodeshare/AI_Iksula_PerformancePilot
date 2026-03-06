// Local storage service for audit persistence
import { AuditState, ReportPackage } from '@/types';

const STORAGE_KEY = 'ai-performance-audit-agent';
const RECENT_AUDITS_KEY = 'recent-audits';

export function saveAuditState(state: AuditState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`${STORAGE_KEY}-current`, JSON.stringify(state));
    
    // Also add to recent audits list
    if (state.run) {
      const recent = getRecentAudits();
      const existingIndex = recent.findIndex(r => r.run?.runId === state.run?.runId);
      
      if (existingIndex >= 0) {
        recent[existingIndex] = state;
      } else {
        recent.unshift(state);
      }
      
      // Keep only last 10
      const trimmed = recent.slice(0, 10);
      localStorage.setItem(`${STORAGE_KEY}-${RECENT_AUDITS_KEY}`, JSON.stringify(trimmed));
    }
  } catch (error) {
    console.error('Failed to save audit state:', error);
  }
}

export function getAuditState(): AuditState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem(`${STORAGE_KEY}-current`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get audit state:', error);
    return null;
  }
}

export function getRecentAudits(): AuditState[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(`${STORAGE_KEY}-${RECENT_AUDITS_KEY}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get recent audits:', error);
    return [];
  }
}

export function clearCurrentAudit(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`${STORAGE_KEY}-current`);
  } catch (error) {
    console.error('Failed to clear audit state:', error);
  }
}

export function exportReportPackage(reportPackage: ReportPackage): string {
  return JSON.stringify(reportPackage, null, 2);
}

export function importReportPackage(jsonString: string): ReportPackage | null {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Basic validation
    if (!parsed.metadata || !parsed.auditRun || !parsed.pages || !parsed.metrics) {
      throw new Error('Invalid report package structure');
    }
    
    return parsed as ReportPackage;
  } catch (error) {
    console.error('Failed to import report package:', error);
    return null;
  }
}
