'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface FailureRow {
  id: string;
  created_at: string;
  url: string;
  device: string;
  error_code: string;
  message: string;
  phase: string;
  user_email: string | null;
  guest_session: string | null;
}

const CODES = ['', 'timeout', 'rate-limit', 'api-error', 'network', 'no-data', 'page-unreachable', 'psi-page-error', 'quota-exhausted', 'referer-blocked', 'permission-denied', 'preflight-failed'];

/** Central error log (Phase A table, Phase C page). Logged-in Iksula QA only. */
export default function FailuresPage() {
  const { enabled, ready, isTeamMember } = useAuth();
  const [rows, setRows] = useState<FailureRow[]>([]);
  const [code, setCode] = useState('');
  const [url, setUrl] = useState('');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTeamMember) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      let q = supabase.from('audit_failures')
        .select('id, created_at, url, device, error_code, message, phase, user_email, guest_session')
        .gte('created_at', new Date(Date.now() - days * 86_400_000).toISOString())
        .order('created_at', { ascending: false })
        .limit(500);
      if (code) q = q.eq('error_code', code);
      const u = url.trim().replace(/[%,()]/g, ' ');
      if (u) q = q.ilike('url', `%${u}%`);
      const { data, error: err } = await q;
      setLoading(false);
      if (err) return setError('Could not load the error log.');
      setRows((data ?? []) as FailureRow[]);
    }, 250);
    return () => clearTimeout(t);
  }, [isTeamMember, code, url, days]);

  if (!ready) return null;
  if (!enabled || !isTeamMember) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-foreground mb-4">Failures</h1>
        <p role="status" className="text-sm text-muted-foreground">
          The error log is available to the Iksula QA team. <Link href="/login/" className="underline">Team login</Link>
        </p>
      </div>
    );
  }

  const byCode = rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.error_code]: (acc[r.error_code] ?? 0) + 1 }), {});
  const urls = new Set(rows.map(r => r.url)).size;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-1">Failures</h1>
      <p className="text-sm text-muted-foreground mb-6">Every failed audit from every user (guests and team), newest first. Kept for 90 days.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <select aria-label="Period" value={days} onChange={e => setDays(Number(e.target.value))} className="py-2 px-2 text-sm bg-card border border-border rounded-lg text-foreground">
          <option value={1}>Last 24 hours</option><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
        </select>
        <select aria-label="Error type" value={code} onChange={e => setCode(e.target.value)} className="py-2 px-2 text-sm bg-card border border-border rounded-lg text-foreground">
          {CODES.map(c => <option key={c} value={c}>{c || 'All error types'}</option>)}
        </select>
        <input aria-label="Filter by URL" placeholder="Filter by URL…" value={url} onChange={e => setUrl(e.target.value)} className="py-2 px-3 w-[260px] text-sm bg-card border border-border rounded-lg text-foreground" />
      </div>

      <p className="text-sm text-foreground mb-3" role="status">
        <strong>{rows.length}</strong> failures on <strong>{urls}</strong> URLs
        {Object.keys(byCode).length > 0 && <> &middot; {Object.entries(byCode).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(', ')}</>}
        {rows.length === 500 && ' (showing the latest 500)'}
      </p>
      {error && <p role="alert" className="text-sm text-destructive mb-3">{error}</p>}

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {['When', 'URL', 'Device', 'Error', 'Message', 'Who'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.1em]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No failures in this period.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="border-b border-border/50 last:border-0 align-top">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td className="px-4 py-3 font-mono text-xs break-all">{r.url}</td>
                <td className="px-4 py-3 text-xs">{r.device}</td>
                <td className="px-4 py-3 text-xs font-mono">{r.error_code}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[420px]">{r.message}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.user_email ? r.user_email.replace('@iksula.com', '') : 'guest'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
