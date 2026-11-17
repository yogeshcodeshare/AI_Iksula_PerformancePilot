import type { Page, Route } from '@playwright/test';

/**
 * In-memory fake of the Supabase endpoints the app uses (Auth + PostgREST),
 * served at https://sb-e2e.test (the URL baked into the dist-team build).
 * It also imitates the database rules that matter to the UI:
 * guests can only insert failures; runs are stamped with the logged-in user.
 */
export const SB = 'https://sb-e2e.test';

export interface FakeUser { id: string; email: string }
export const QA: FakeUser = { id: '00000000-0000-4000-8000-000000000001', email: 'qa.tester@iksula.com' };
export const OTHER: FakeUser = { id: '00000000-0000-4000-8000-000000000002', email: 'other.qa@iksula.com' };

type Row = Record<string, unknown>;
export interface FakeDb {
  runs: Row[];
  failures: Row[];
  /** every request made, for assertions */
  requests: { method: string; path: string; body: unknown; auth: string | null }[];
  user: FakeUser | null;
}

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
export function fakeJwt(u: FakeUser) {
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: u.id, email: u.email, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600 })}.sig`;
}

export function fakeSession(u: FakeUser) {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: fakeJwt(u), token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'fake-refresh',
    user: { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: new Date().toISOString(),
            app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() },
  };
}

/** Start the page already logged in (session stored where supabase-js looks for it). */
export async function loginAs(page: Page, u: FakeUser) {
  const s = JSON.stringify(fakeSession(u));
  await page.addInitScript(v => localStorage.setItem('pp-auth', v), s);
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'access-control-expose-headers': 'content-range',
};

/** eq.<v> filters from a PostgREST query string */
function eqFilters(u: URL) {
  const out: Record<string, string> = {};
  u.searchParams.forEach((v, k) => { if (v.startsWith('eq.')) out[k] = v.slice(3); });
  return out;
}

function project(row: Row, select: string | null): Row {
  if (!select || select === '*') return row;
  const o: Row = {};
  for (const c of select.split(',').map(s => s.trim())) o[c] = row[c];
  return o;
}

export async function mockSupabase(page: Page, init: Partial<FakeDb> = {}): Promise<FakeDb> {
  const db: FakeDb = { runs: [], failures: [], requests: [], user: null, ...init };

  await page.route(`${SB}/**`, async (route: Route) => {
    const req = route.request();
    const u = new URL(req.url());
    const method = req.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const auth = req.headers()['authorization'] ?? null;
    let body: unknown = null;
    try { body = req.postDataJSON(); } catch { body = req.postData(); }
    db.requests.push({ method, path: u.pathname + u.search, body, auth });

    const json = (status: number, data: unknown, extra: Record<string, string> = {}) =>
      route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json', ...extra }, body: data === null ? '' : JSON.stringify(data) });

    // The JWT tells us who is calling (anon key alone = guest)
    const token = auth?.replace(/^Bearer /, '') ?? '';
    let caller: FakeUser | null = null;
    try {
      const p = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString());
      if (p?.sub && p?.email) caller = { id: p.sub, email: p.email };
    } catch { /* anon */ }

    // ── Auth ──
    if (u.pathname === '/auth/v1/token') {
      const { email, password } = (body ?? {}) as { email?: string; password?: string };
      if (password !== 'correct-password') return json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials', code: 'invalid_credentials' });
      const user = { id: QA.id, email: email! };
      db.user = user;
      return json(200, fakeSession(user));
    }
    if (u.pathname === '/auth/v1/user') return caller ? json(200, fakeSession(caller).user) : json(401, { msg: 'no session' });
    if (u.pathname === '/auth/v1/logout') { db.user = null; return route.fulfill({ status: 204, headers: CORS }); }

    // ── PostgREST ──
    const table = u.pathname.replace('/rest/v1/', '');
    const rows = table === 'audit_runs' ? db.runs : table === 'audit_failures' ? db.failures : null;
    if (!rows) return json(404, { message: 'unknown table' });

    if (method === 'POST') {
      const items = (Array.isArray(body) ? body : [body]) as Row[];
      if (table === 'audit_runs') {
        if (!caller) return json(401, { message: 'permission denied for table audit_runs' });
        for (const r of items) {
          const i = db.runs.findIndex(x => x.id === r.id);
          const stamped = { ...r, created_by: caller.id, created_by_email: caller.email, created_at: new Date().toISOString() };
          if (i >= 0) db.runs[i] = { ...db.runs[i], ...r }; else db.runs.unshift(stamped);
        }
      } else {
        for (const r of items) {
          db.failures.unshift({ id: `f${db.failures.length + 1}`, ...r, created_at: new Date().toISOString(),
            user_email: caller?.email ?? null, guest_session: caller ? null : r.guest_session });
        }
      }
      return json(201, null);
    }

    if (method === 'GET') {
      if (!caller) return json(200, []); // RLS: guests read nothing
      const f = eqFilters(u);
      const out = rows.filter(r => Object.entries(f).every(([k, v]) => String(r[k]) === v));
      return json(200, out.map(r => project(r, u.searchParams.get('select'))), { 'content-range': `0-${Math.max(0, out.length - 1)}/${out.length}` });
    }

    if (method === 'DELETE' && table === 'audit_runs') {
      const f = eqFilters(u);
      const before = db.runs.length;
      // RLS: only your own runs
      db.runs = db.runs.filter(r => !(r.id === f.id && caller && r.created_by === caller.id));
      const n = before - db.runs.length;
      return route.fulfill({ status: 204, headers: { ...CORS, 'content-range': n ? `0-${n - 1}/${n}` : '*/0' } });
    }
    return json(405, { message: 'not mocked' });
  });
  return db;
}
