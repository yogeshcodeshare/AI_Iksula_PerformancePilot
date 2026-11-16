import { describe, it, expect, vi, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { trimDiagnostics, toRunRow, reportToState, saveRun, listRuns, deleteRun, MAX_DIAGNOSTICS_PER_PAGE_DEVICE } from './runStore';
import { orderForCompare } from '@/components/dashboard/SavedRuns';
import { __setSupabaseForTests } from '@/lib/supabase';
import { makeReport } from '../../test/fixtures/reports';
import type { AuditState, DiagnosticItem } from '@/types';

const diag = (i: number, status: string, pageId = 'p1', device = 'mobile') =>
  ({ id: `d${i}`, pageId, device, category: 'performance', group: 'opportunities', auditKey: `a${i}`, title: 't', description: 'd',
     status, scoreDisplayMode: 'numeric', details: 'x'.repeat(5000) }) as unknown as DiagnosticItem;

function stateFrom(runId = 'run-1'): AuditState {
  const r = makeReport(runId, [{ url: 'https://shop.test/' }, { url: 'https://shop.test/pdp', pageType: 'pdp' }]);
  return {
    run: { ...r.auditRun, projectName: 'Shop', auditLabel: 'Release 3.2', environment: 'production' },
    pages: r.pages, metrics: r.metrics, categoryScores: [], cwvAssessments: [],
    diagnostics: [diag(1, 'fail'), diag(2, 'pass'), diag(3, 'warning')],
    status: 'completed', progress: { total: 4, completed: 4 }, pageFailures: [],
  } as unknown as AuditState;
}

/** Chainable fake of the supabase-js query builder that records calls. */
function fakeClient(opts: { email?: string | null; result?: unknown; error?: { message: string } | null; count?: number } = {}) {
  const calls: Array<[string, unknown[]]> = [];
  const result = { data: opts.result ?? [], error: opts.error ?? null, count: opts.count ?? 1 };
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'range', 'eq', 'ilike', 'gte', 'lte', 'or', 'limit', 'delete', 'maybeSingle']) {
    builder[m] = (...args: unknown[]) => { calls.push([m, args]); return builder; };
  }
  builder.upsert = (...args: unknown[]) => { calls.push(['upsert', args]); return Promise.resolve(result); };
  builder.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
  const session = opts.email === null ? null : { user: { id: 'u1', email: opts.email ?? 'qa@iksula.com' } };
  __setSupabaseForTests({
    from: (table: string) => { calls.push(['from', [table]]); return builder; },
    auth: { getSession: () => Promise.resolve({ data: { session } }) },
  } as unknown as SupabaseClient);
  return calls;
}

afterEach(() => { __setSupabaseForTests(undefined); vi.restoreAllMocks(); });

describe('trimDiagnostics', () => {
  it('keeps only fail/warning items, drops long details, caps per page+device', () => {
    const many = Array.from({ length: 40 }, (_, i) => diag(i, i % 2 ? 'fail' : 'warning'));
    const out = trimDiagnostics([...many, diag(99, 'pass'), diag(100, 'fail', 'p2')]);
    expect(out.filter(d => d.pageId === 'p1')).toHaveLength(MAX_DIAGNOSTICS_PER_PAGE_DEVICE);
    expect(out.filter(d => d.pageId === 'p2')).toHaveLength(1);
    expect(out.every(d => d.status !== 'pass' && d.details === undefined)).toBe(true);
  });
});

describe('toRunRow / reportToState', () => {
  it('builds summary columns and a trimmed report that round-trips', () => {
    const row = toRunRow(stateFrom());
    expect(row).toMatchObject({ id: 'run-1', project_name: 'Shop', audit_label: 'Release 3.2', page_count: 2, failure_count: 0 });
    expect(row.overall_health).toBeGreaterThanOrEqual(0);
    expect(row.page_urls).toEqual(['https://shop.test/', 'https://shop.test/pdp']);
    expect(row.report.diagnostics.map(d => d.status)).toEqual(['fail', 'warning']);
    const back = reportToState(row.report);
    expect(back.run?.runId).toBe('run-1');
    expect(back.pages).toHaveLength(2);
  });

  it('keeps a typical report well under the 2 MB database limit', () => {
    const s = stateFrom();
    s.diagnostics = Array.from({ length: 400 }, (_, i) => diag(i, 'fail', `p${i % 2}`, i % 4 < 2 ? 'mobile' : 'desktop'));
    expect(JSON.stringify(toRunRow(s).report).length).toBeLessThan(200_000);
  });
});

describe('saveRun', () => {
  it('does nothing for guests or when Supabase is off', async () => {
    __setSupabaseForTests(null);
    expect(await saveRun(stateFrom())).toBe(false);
    const calls = fakeClient({ email: null });
    expect(await saveRun(stateFrom())).toBe(false);
    expect(calls.find(c => c[0] === 'upsert')).toBeUndefined();
  });

  it('does nothing for a non-Iksula session', async () => {
    const calls = fakeClient({ email: 'x@gmail.com' });
    expect(await saveRun(stateFrom())).toBe(false);
    expect(calls.find(c => c[0] === 'upsert')).toBeUndefined();
  });

  it('upserts by run id for an Iksula user', async () => {
    const calls = fakeClient();
    expect(await saveRun(stateFrom())).toBe(true);
    const up = calls.find(c => c[0] === 'upsert')!;
    expect((up[1][0] as { id: string }).id).toBe('run-1');
    expect(up[1][1]).toEqual({ onConflict: 'id' });
  });

  it('never throws when the database rejects', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    fakeClient({ error: { message: 'new row violates row-level security policy' } });
    await expect(saveRun(stateFrom())).resolves.toBe(false);
  });
});

describe('listRuns / deleteRun', () => {
  it('"My audits" filters by the signed-in user; filters are applied', async () => {
    const calls = fakeClient({ result: [] });
    await listRuns({ scope: 'mine', search: 'shop', project: 'Shop', from: '2026-01-01' });
    expect(calls).toContainEqual(['eq', ['created_by', 'u1']]);
    expect(calls).toContainEqual(['ilike', ['project_name', 'Shop']]);
    expect(calls).toContainEqual(['gte', ['created_at', '2026-01-01']]);
    expect(calls.find(c => c[0] === 'or')?.[1][0]).toContain('project_name.ilike.%shop%');
  });

  it('"Team audits" does not filter by owner and reports hasMore', async () => {
    const calls = fakeClient({ result: Array.from({ length: 26 }, (_, i) => ({ id: `r${i}` })) });
    const res = await listRuns({ scope: 'team' });
    expect(calls.find(c => c[0] === 'eq')).toBeUndefined();
    expect(res.rows).toHaveLength(25);
    expect(res.hasMore).toBe(true);
  });

  it('search text cannot inject extra filter syntax', async () => {
    const calls = fakeClient({ result: [] });
    await listRuns({ scope: 'team', search: 'a,id.eq.1)' });
    expect(calls.find(c => c[0] === 'or')?.[1][0]).not.toMatch(/,id\.eq/);
  });

  it('returns nothing for guests', async () => {
    fakeClient({ email: null });
    expect(await listRuns({ scope: 'team' })).toEqual({ rows: [], hasMore: false });
  });

  it('deleteRun reports false when the database deleted nothing (not the owner)', async () => {
    fakeClient({ count: 0 });
    expect(await deleteRun('someone-elses-run')).toBe(false);
  });
});

describe('orderForCompare', () => {
  it('uses the older run as the baseline regardless of selection order', () => {
    const older = { id: 'a', created_at: '2026-01-01T00:00:00Z' } as never;
    const newer = { id: 'b', created_at: '2026-02-01T00:00:00Z' } as never;
    expect(orderForCompare(newer, older)).toEqual({ baseline: older, current: newer });
  });
});
