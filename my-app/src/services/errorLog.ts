/**
 * Central error log (Phase A, decisions.md D005, architecture/database-sop.md).
 *
 * Sends remaining page+device failures to Supabase `audit_failures` for every
 * user (guest or logged in). Best-effort: never throws, never blocks an audit.
 * When Supabase is not configured this is a no-op.
 */
import { getSupabase } from '@/lib/supabase';
import { APP_VERSION } from '@/lib/constants';

export interface LoggableFailure {
  pageId: string;
  device: string;
  errorCode: string;
  errorMessage: string;
}

export interface LogContext {
  runId: string;
  pages: { pageId: string; url: string }[];
  phase: 'run' | 'retry';
}

export const MAX_ROWS_PER_CALL = 50;
const MAX_MESSAGE = 1000;
const GUEST_KEY = 'pp-guest-session';

const KNOWN_CODES = new Set([
  'timeout', 'rate-limit', 'api-error', 'network', 'no-data', 'referer-blocked',
  'permission-denied', 'quota-exhausted', 'preflight-failed', 'page-unreachable', 'psi-page-error',
]);

/** Random anonymous id per browser, so one guest's failures can be grouped. */
export function getGuestSession(): string {
  try {
    const existing = localStorage.getItem(GUEST_KEY);
    if (existing && existing.length >= 8) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID(); // storage blocked: still valid per call
  }
}

/** Shape rows exactly as the database constraints expect (pure, unit-tested). */
export function toFailureRows(failures: LoggableFailure[], ctx: LogContext, guestSession: string) {
  return failures
    .map(f => {
      const url = ctx.pages.find(p => p.pageId === f.pageId)?.url ?? '';
      return {
        run_id: ctx.runId,
        url,
        device: f.device,
        error_code: KNOWN_CODES.has(f.errorCode) ? f.errorCode : 'api-error',
        message: (f.errorMessage || '').slice(0, MAX_MESSAGE),
        phase: ctx.phase,
        app_version: APP_VERSION.slice(0, 32),
        guest_session: guestSession,
      };
    })
    .filter(r => /^https?:\/\//i.test(r.url) && (r.device === 'mobile' || r.device === 'desktop'))
    .slice(0, MAX_ROWS_PER_CALL);
}

/**
 * Log failures. Resolves to the number of rows sent (0 when disabled, empty or on error).
 * Never rejects.
 */
export async function logFailures(failures: LoggableFailure[] | undefined, ctx: LogContext): Promise<number> {
  try {
    const supabase = getSupabase();
    if (!supabase || !failures?.length) return 0;
    const rows = toFailureRows(failures, ctx, getGuestSession());
    if (rows.length === 0) return 0;
    const { error } = await supabase.from('audit_failures').insert(rows);
    if (error) {
      console.warn('[errorLog] could not log failures:', error.message);
      return 0;
    }
    return rows.length;
  } catch (e) {
    console.warn('[errorLog] could not log failures:', e);
    return 0;
  }
}
