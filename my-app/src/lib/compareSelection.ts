/**
 * Dashboard "Compare selected": one shared selection across "Saved audits"
 * (account) and "This browser" (IndexedDB). The compare page loads each run
 * from this browser first, then from the account (see app/compare/page.tsx).
 */
export interface ComparePick {
  id: string;
  /** when the run was generated (ISO), used to pick the baseline */
  at: string;
  label: string;
}

/** Add or remove a run; at most two are kept (the oldest pick is dropped). */
export function togglePick(list: ComparePick[], pick: ComparePick): ComparePick[] {
  if (list.some(p => p.id === pick.id)) return list.filter(p => p.id !== pick.id);
  return list.length >= 2 ? [list[1], pick] : [...list, pick];
}

/** The older run is the baseline. */
export function orderPicks(a: ComparePick, b: ComparePick): { baseline: ComparePick; current: ComparePick } {
  return new Date(a.at).getTime() <= new Date(b.at).getTime() ? { baseline: a, current: b } : { baseline: b, current: a };
}

export function compareUrl(picks: ComparePick[]): string | null {
  if (picks.length !== 2) return null;
  const { baseline, current } = orderPicks(picks[0], picks[1]);
  return `/compare/?baseline=${encodeURIComponent(baseline.id)}&current=${encodeURIComponent(current.id)}`;
}
