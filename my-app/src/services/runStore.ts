/**
 * Saved runs for logged-in Iksula QA (Phase C, architecture/database-sop.md).
 * All functions are safe to call when Supabase is off or the user is a guest:
 * they return empty results / false instead of throwing.
 */
import { getSupabase } from '@/lib/supabase';
import { isTeamEmail } from '@/lib/auth';
import { calculateOverallHealth } from '@/lib/utils';
import { generateReportPackage } from '@/services/export';
import type { AuditState, DiagnosticItem, ReportPackage } from '@/types';

export const MAX_DIAGNOSTICS_PER_PAGE_DEVICE = 15;
export const PAGE_SIZE = 25;

export interface RunSummary {
  id: string;
  created_at: string;
  /** when the audit itself ran (can be earlier than created_at for 'Save to my account') */
  run_generated_at?: string | null;
  created_by: string;
  created_by_email: string;
  project_name: string;
  audit_label: string;
  environment: string;
  deployment_tag: string;
  page_count: number;
  failure_count: number;
  overall_health: number | null;
  page_urls: string[];
}

export type RunScope = 'mine' | 'team';

export interface ListOptions {
  scope: RunScope;
  search?: string;
  project?: string;
  from?: string; // ISO date
  to?: string;   // ISO date
  page?: number; // 0-based
}

/** Keep failing/warning diagnostics only, capped per page+device, without long details. */
const LAB_METRIC_KEYS = new Set([
  'largest-contentful-paint', 'first-contentful-paint', 'total-blocking-time',
  'cumulative-layout-shift', 'speed-index',
]);

export function trimDiagnostics(diagnostics: DiagnosticItem[]): DiagnosticItem[] {
  const counts = new Map<string, number>();
  const out: DiagnosticItem[] = [];
  for (const d of diagnostics) {
    // Lab metric audits are always kept (needed for TBT / Speed Index comparison)
    if (LAB_METRIC_KEYS.has(d.auditKey)) {
      const { details: _d, ...keep } = d;
      out.push(keep as DiagnosticItem);
      continue;
    }
    if (d.status !== 'fail' && d.status !== 'warning') continue;
    const key = `${d.pageId}:${d.device}`;
    const n = counts.get(key) ?? 0;
    if (n >= MAX_DIAGNOSTICS_PER_PAGE_DEVICE) continue;
    counts.set(key, n + 1);
    const { details: _details, ...rest } = d;
    out.push(rest as DiagnosticItem);
  }
  return out;
}

/** Build the database row for a finished audit (pure; unit-tested). */
export function toRunRow(state: AuditState) {
  if (!state.run) throw new Error('No run to save');
  const report: ReportPackage = generateReportPackage(
    state.run, state.pages, state.metrics, state.categoryScores ?? [],
    trimDiagnostics(state.diagnostics ?? []), state.cwvAssessments ?? [],
  );
  return {
    id: state.run.runId,
    project_name: (state.run.projectName || 'Untitled').slice(0, 200),
    audit_label: (state.run.auditLabel || '').slice(0, 200),
    environment: (state.run.environment || '').slice(0, 50),
    deployment_tag: (state.run.deploymentTag || '').slice(0, 100),
    run_generated_at: state.run.generatedAt || null,
    page_count: state.pages.length,
    metric_count: state.metrics.length,
    failure_count: state.pageFailures?.length ?? 0,
    overall_health: state.metrics.length ? calculateOverallHealth(state.metrics) : null,
    page_urls: state.pages.map(p => p.url).slice(0, 500),
    report,
  };
}

/** Convert a stored report back into the AuditState shape the results page uses. */
export function reportToState(report: ReportPackage): AuditState {
  return {
    run: report.auditRun,
    pages: report.pages,
    metrics: report.metrics,
    categoryScores: report.categoryScores ?? [],
    diagnostics: report.diagnostics ?? [],
    cwvAssessments: report.cwvAssessments ?? [],
    status: 'completed',
    progress: { total: report.pages.length * 2, completed: report.pages.length * 2 },
  } as AuditState;
}

async function teamUser(): Promise<{ id: string; email: string } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  return user && isTeamEmail(user.email) ? { id: user.id, email: user.email! } : null;
}

/** Save (or update) a run for the logged-in team member. Returns true when saved. Never throws. */
export async function saveRun(state: AuditState): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase || !state.run || !(await teamUser())) return false;
    const { error } = await supabase.from('audit_runs').upsert(toRunRow(state), { onConflict: 'id' });
    if (error) {
      console.warn('[runStore] could not save run:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[runStore] could not save run:', e);
    return false;
  }
}

const SUMMARY_COLUMNS =
  'id, created_at, run_generated_at, created_by, created_by_email, project_name, audit_label, environment, deployment_tag, page_count, failure_count, overall_health, page_urls';

/** List saved runs (newest first). Returns { rows, hasMore }. */
export async function listRuns(opts: ListOptions): Promise<{ rows: RunSummary[]; hasMore: boolean }> {
  const supabase = getSupabase();
  const me = await teamUser();
  if (!supabase || !me) return { rows: [], hasMore: false };
  const page = opts.page ?? 0;
  let q = supabase.from('audit_runs').select(SUMMARY_COLUMNS)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE); // one extra row to detect "more"
  if (opts.scope === 'mine') q = q.eq('created_by', me.id);
  if (opts.project) q = q.ilike('project_name', opts.project);
  if (opts.from) q = q.gte('created_at', opts.from);
  if (opts.to) q = q.lte('created_at', opts.to);
  const s = opts.search?.trim().replace(/[%,()]/g, ' ');
  if (s) q = q.or(`project_name.ilike.%${s}%,audit_label.ilike.%${s}%,created_by_email.ilike.%${s}%`);
  const { data, error } = await q;
  if (error || !data) {
    if (error) console.warn('[runStore] list failed:', error.message);
    return { rows: [], hasMore: false };
  }
  const rows = data as unknown as RunSummary[];
  return { rows: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}

/** Load one saved run's report. */
export async function getRunReport(id: string): Promise<ReportPackage | null> {
  const supabase = getSupabase();
  if (!supabase || !(await teamUser())) return null;
  const { data, error } = await supabase.from('audit_runs').select('report').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return (data as { report: ReportPackage }).report;
}

/** Delete one of your own runs (the database refuses other people's). */
export async function deleteRun(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || !(await teamUser())) return false;
  const { error, count } = await supabase.from('audit_runs').delete({ count: 'exact' }).eq('id', id);
  return !error && (count ?? 0) > 0;
}

/** Distinct project names for the filter (from the most recent 500 runs). */
export async function listProjects(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase || !(await teamUser())) return [];
  const { data } = await supabase.from('audit_runs').select('project_name').order('created_at', { ascending: false }).limit(500);
  return Array.from(new Set((data ?? []).map((r: { project_name: string }) => r.project_name))).sort((a, b) => a.localeCompare(b));
}
