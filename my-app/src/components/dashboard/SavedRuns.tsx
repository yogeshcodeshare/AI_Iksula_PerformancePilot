'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { listRuns, listProjects, deleteRun, type RunScope, type RunSummary } from '@/services/runStore';

const healthColors = (h: number) => ({
  bg: h >= 80 ? 'var(--green-bg)' : h >= 50 ? 'var(--amber-bg)' : 'var(--red-bg)',
  text: h >= 80 ? 'var(--green-text)' : h >= 50 ? 'var(--amber-text)' : 'var(--red-text)',
});

/** Pick baseline (older) and current (newer) from two selected runs. */
export function orderForCompare(a: RunSummary, b: RunSummary): { baseline: RunSummary; current: RunSummary } {
  return new Date(a.created_at) <= new Date(b.created_at) ? { baseline: a, current: b } : { baseline: b, current: a };
}

/** Team history for logged-in Iksula QA (Phase C). Renders nothing for guests. */
export function SavedRuns() {
  const { isTeamMember, email } = useAuth();
  const router = useRouter();
  const [scope, setScope] = useState<RunScope>('mine');
  const [search, setSearch] = useState('');
  const [project, setProject] = useState('');
  const [from, setFrom] = useState('');
  const [projects, setProjects] = useState<string[]>([]);
  const [rows, setRows] = useState<RunSummary[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const load = useCallback(async (nextPage: number, append: boolean) => {
    setLoading(true);
    const res = await listRuns({ scope, search, project: project || undefined, from: from || undefined, page: nextPage });
    setRows(prev => (append ? [...prev, ...res.rows] : res.rows));
    setHasMore(res.hasMore);
    setPage(nextPage);
    setLoading(false);
  }, [scope, search, project, from]);

  useEffect(() => {
    if (!isTeamMember) return;
    const t = setTimeout(() => { void load(0, false); }, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [isTeamMember, load]);

  useEffect(() => {
    if (isTeamMember) void listProjects().then(setProjects);
  }, [isTeamMember]);

  if (!isTeamMember) return null;

  const toggle = (id: string) =>
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : s.length >= 2 ? [s[1], id] : [...s, id]));

  const compare = () => {
    const [a, b] = selected.map(id => rows.find(r => r.id === id)).filter(Boolean) as RunSummary[];
    if (!a || !b) return;
    const { baseline, current } = orderForCompare(a, b);
    router.push(`/compare/?baseline=${encodeURIComponent(baseline.id)}&current=${encodeURIComponent(current.id)}`);
  };

  const remove = async (r: RunSummary) => {
    if (!confirm(`Delete "${r.project_name} – ${r.audit_label || 'run'}" from the team history? This cannot be undone.`)) return;
    if (await deleteRun(r.id)) {
      setRows(rs => rs.filter(x => x.id !== r.id));
      setSelected(s => s.filter(x => x !== r.id));
    } else {
      alert('Could not delete this run.');
    }
  };

  const tab = (value: RunScope, label: string) => (
    <button type="button" role="tab" aria-selected={scope === value}
      onClick={() => { setScope(value); setSelected([]); }}
      className={`px-3 py-1.5 text-sm rounded-lg border-none cursor-pointer ${scope === value ? 'bg-foreground text-background font-semibold' : 'bg-transparent text-muted-foreground hover:text-foreground'}`}>
      {label}
    </button>
  );

  return (
    <section className="mb-12" aria-labelledby="saved-runs-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-4">
          <h2 id="saved-runs-heading" className="text-[22px] font-bold text-foreground tracking-[-0.02em]">Saved audits</h2>
          <div role="tablist" aria-label="Whose audits" className="flex gap-1 p-1 rounded-xl border border-border bg-card">
            {tab('mine', 'My audits')}
            {tab('team', 'Team audits')}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input aria-label="Search saved audits" placeholder="Search project, label, person…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="py-2 px-3 w-[220px] text-sm bg-card border border-border rounded-lg text-foreground outline-none" />
          <select aria-label="Filter by project" value={project} onChange={e => setProject(e.target.value)}
            className="py-2 px-2 text-sm bg-card border border-border rounded-lg text-foreground">
            <option value="">All projects</option>
            {projects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input aria-label="From date" type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="py-2 px-2 text-sm bg-card border border-border rounded-lg text-foreground" />
          <button type="button" disabled={selected.length !== 2} onClick={compare}
            className="text-sm font-semibold px-4 py-2 rounded-lg border-none cursor-pointer bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed">
            Compare selected ({selected.length}/2)
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {rows.length === 0 && !loading ? (
          <p className="text-center py-10 text-muted-foreground text-sm">
            {scope === 'mine'
              ? 'No saved audits yet. Audits you run while logged in are saved here automatically.'
              : 'No team audits match these filters.'}
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 w-10"><span className="sr-only">Select</span></th>
                {['Project', 'Label', 'Overall health', 'Pages', 'Run by', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.1em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const h = r.overall_health ?? 0;
                const c = healthColors(h);
                const mine = r.created_by_email === email?.toLowerCase();
                return (
                  <tr key={r.id} className="table-row-hover border-b border-border/50 last:border-0">
                    <td className="px-4 py-3">
                      <input type="checkbox" aria-label={`Select ${r.project_name} ${r.audit_label}`}
                        checked={selected.includes(r.id)} onChange={() => toggle(r.id)} />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <button type="button" className="bg-transparent border-none p-0 text-left text-foreground underline-offset-2 hover:underline cursor-pointer"
                        onClick={() => router.push(`/results?runId=${r.id}`)}>{r.project_name}</button>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{r.audit_label || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="status-badge" style={{ background: c.bg, color: c.text }}>{r.overall_health ?? '—'}%</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{r.page_count}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{mine ? 'You' : r.created_by_email.replace('@iksula.com', '')}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {mine && (
                        <button type="button" onClick={() => void remove(r)} aria-label={`Delete ${r.project_name} ${r.audit_label}`}
                          className="text-xs bg-transparent border-none cursor-pointer" style={{ color: 'var(--red-text)' }}>Delete</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {(hasMore || loading) && (
          <div className="p-3 text-center border-t border-border">
            <button type="button" disabled={loading} onClick={() => void load(page + 1, true)}
              className="text-sm bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground">
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">Tick any two audits and press Compare. The older one is used as the baseline.</p>
    </section>
  );
}
