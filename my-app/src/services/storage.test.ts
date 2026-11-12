import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveAuditStateAsync, getAuditStateByRunId, getRecentAudits, deleteRecentAudit,
  saveSettings, getSettings, importReportPackage, saveBaselineReportAsync,
  getBaselineReportAsync, clearBaselineReportAsync,
} from './storage';
import type { AuditState } from '@/types';
import { makeReport } from '../../test/fixtures/reports';

const stateFor = (runId: string): AuditState => {
  const r = makeReport(runId, [{ url: 'https://shop.test/' }]);
  return {
    run: { ...r.auditRun, runId, projectName: `Project ${runId}` },
    pages: r.pages, metrics: r.metrics, categoryScores: [], diagnostics: [], cwvAssessments: [],
  } as unknown as AuditState;
};

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('audit state persistence (IndexedDB)', () => {
  it('round-trips a run by its ID', async () => {
    await saveAuditStateAsync(stateFor('run-1'));
    const back = await getAuditStateByRunId('run-1');
    expect(back?.run?.runId).toBe('run-1');
    expect(back?.metrics).toHaveLength(10);
  });

  it('returns null for an unknown run ID', async () => {
    expect(await getAuditStateByRunId('nope')).toBeNull();
  });
});

describe('recent audits list', () => {
  it('keeps the newest 5, newest first, with health score', async () => {
    for (let i = 1; i <= 7; i++) await saveAuditStateAsync(stateFor(`r${i}`));
    const recent = getRecentAudits();
    expect(recent.map(a => a.runId)).toEqual(['r7', 'r6', 'r5', 'r4', 'r3']);
    expect(recent[0].overallHealth).toBeGreaterThanOrEqual(0);
  });

  it('re-saving a run does not duplicate it', async () => {
    await saveAuditStateAsync(stateFor('dup'));
    await saveAuditStateAsync(stateFor('dup'));
    expect(getRecentAudits().filter(a => a.runId === 'dup')).toHaveLength(1);
  });

  it('deletes a recent audit', async () => {
    await saveAuditStateAsync(stateFor('gone'));
    deleteRecentAudit('gone');
    expect(getRecentAudits().some(a => a.runId === 'gone')).toBe(false);
  });

  it('survives corrupted localStorage', () => {
    localStorage.setItem('ai-performance-audit-agent-recent-audits', '{not json');
    expect(getRecentAudits()).toEqual([]);
  });
});

describe('settings', () => {
  it('saves and reads thresholds', () => {
    saveSettings({ thresholds: { LCP: { good: 2000, warn: 3500 } } });
    expect(getSettings().thresholds?.LCP).toEqual({ good: 2000, warn: 3500 });
  });
  it('defaults to {} when nothing is stored', () => expect(getSettings()).toEqual({}));
});

describe('importReportPackage (Compare upload)', () => {
  it('accepts a report exported by the app', () => {
    const pkg = importReportPackage(JSON.stringify(makeReport('A', [{ url: 'https://shop.test/' }])));
    expect(pkg?.pages).toHaveLength(1);
  });

  it('fills missing newer fields for older exports', () => {
    const old = makeReport('A', [{ url: 'https://shop.test/' }]) as Partial<ReturnType<typeof makeReport>>;
    delete old.categoryScores; delete old.diagnostics; delete old.cwvAssessments;
    const pkg = importReportPackage(JSON.stringify(old));
    expect(pkg).toMatchObject({ categoryScores: [], diagnostics: [], cwvAssessments: [] });
  });

  it('rejects files missing required fields', () => {
    expect(importReportPackage(JSON.stringify({ pages: [] }))).toBeNull();
  });

  it('rejects non-JSON', () => expect(importReportPackage('<html>')).toBeNull());
});

describe('baseline report', () => {
  it('is saved, read back, then cleared', async () => {
    await saveBaselineReportAsync(makeReport('BASE', [{ url: 'https://shop.test/' }]));
    expect((await getBaselineReportAsync())?.auditRun.runId).toBe('BASE');
    await clearBaselineReportAsync();
    expect(await getBaselineReportAsync()).toBeNull();
  });
});
