/**
 * Plain-English guide for every audit error code (single source of truth for
 * the progress page chips, the "What these errors mean" box and reports).
 */
export interface ErrorGuideEntry {
  label: string;
  meaning: string;
  action: string;
  /** Retrying (automatically or with the Retry button) can help. */
  retryHelps: boolean;
}

export const ERROR_GUIDE: Record<string, ErrorGuideEntry> = {
  'timeout': {
    label: 'Timeout',
    meaning: 'Google took too long to test this page (a heavy or slow site, or Google was busy).',
    action: 'We already retried once automatically. Try Retry later, or audit fewer pages at a time.',
    retryHelps: true,
  },
  'rate-limit': {
    label: 'Rate limit',
    meaning: 'Too many tests were sent to Google in a short time.',
    action: 'Wait about a minute, then press Retry.',
    retryHelps: true,
  },
  'api-error': {
    label: 'API error',
    meaning: 'Google’s testing service had a temporary problem.',
    action: 'Usually fixed by pressing Retry after a minute.',
    retryHelps: true,
  },
  'network': {
    label: 'Network',
    meaning: 'Your computer could not reach Google’s testing service.',
    action: 'Check your internet connection, then press Retry.',
    retryHelps: true,
  },
  'no-data': {
    label: 'No data',
    meaning: 'Google tested the page but returned no usable measurements.',
    action: 'Press Retry; if it repeats, check the page at pagespeed.web.dev.',
    retryHelps: true,
  },
  'psi-page-error': {
    label: 'Page not auditable',
    meaning: 'The page loaded but Google could not analyse it (often bot protection or a page that never finishes painting).',
    action: 'Try it at pagespeed.web.dev. If it fails there too, this page cannot be tested by Google.',
    retryHelps: true,
  },
  'page-unreachable': {
    label: 'Site unreachable',
    meaning: 'Google could not open this URL (wrong address, site down, or a file such as a PDF).',
    action: 'Check the URL opens in your browser and is public. Retrying will not help.',
    retryHelps: false,
  },
  'quota-exhausted': {
    label: 'Quota exhausted',
    meaning: 'Today’s Google testing limit for this app has been used up.',
    action: 'Try again tomorrow, or ask the admin to raise the limit.',
    retryHelps: false,
  },
  'referer-blocked': {
    label: 'Key blocks site',
    meaning: 'The app’s Google key is not allowed to run from this website address.',
    action: 'Contact the PerformancePilot admin. Retrying will not help.',
    retryHelps: false,
  },
  'permission-denied': {
    label: 'Key denied',
    meaning: 'The app’s Google key is invalid or the PageSpeed service is switched off.',
    action: 'Contact the PerformancePilot admin. Retrying will not help.',
    retryHelps: false,
  },
  'preflight-failed': {
    label: 'Pre-flight failed',
    meaning: 'The start-up check with Google failed, so the audit did not run.',
    action: 'Contact the PerformancePilot admin if this keeps happening.',
    retryHelps: false,
  },
};

export function guideFor(code: string | undefined): ErrorGuideEntry | null {
  return code ? ERROR_GUIDE[code] ?? null : null;
}

/** Distinct codes in display order (most actionable first). */
export function codesInRun(codes: Array<string | undefined>): string[] {
  const order = Object.keys(ERROR_GUIDE);
  const set = new Set(codes.filter((c): c is string => !!c && c in ERROR_GUIDE));
  return order.filter(c => set.has(c));
}
