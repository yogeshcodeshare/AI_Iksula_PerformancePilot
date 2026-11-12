import type { PageFormData, PageType } from '@/types';

/** Readable default label from a URL, e.g. "https://www.nike.com/in/" -> "nike.com/in". */
export function labelFromUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./i, '');
    const path = u.pathname.replace(/\/+$/, '');
    return path ? `${host}${path}` : host;
  } catch {
    return raw.trim();
  }
}

/** Guess the page type from the URL path so Bulk Add rows match single-add defaults. */
export function pageTypeFromUrl(raw: string): PageType {
  try {
    const u = new URL(raw.trim());
    if (/[?&](q|query|search|s)=/i.test(u.search) || /\/search\b/i.test(u.pathname)) return 'search';
    if (u.pathname.replace(/\/+$/, '') === '') return 'homepage';
  } catch { /* fall through */ }
  return 'custom';
}

/**
 * Merge pasted URLs (one per line) into the existing page rows:
 * - blank lines ignored, each row gets a label + page type
 * - untouched placeholder rows (no URL) are replaced instead of left behind
 */
export function mergeBulkUrls(existing: PageFormData[], pasted: string): PageFormData[] {
  const added: PageFormData[] = pasted
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .map(url => ({ url, pageLabel: labelFromUrl(url), pageType: pageTypeFromUrl(url) }));
  const kept = existing.filter(p => p.url.trim() !== '');
  return [...kept, ...added];
}
